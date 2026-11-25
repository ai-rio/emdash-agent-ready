import type { APIRoute } from "astro";
import { respond } from "../agent/concierge";
import { DEFAULT_LOCALE, isLocale, type Locale } from "../i18n";

/**
 * A2A endpoint (Agent2Agent protocol, JSON-RPC binding): a stateless,
 * read-only concierge that answers from the published site. Speaks v1.0
 * (SendMessage, ROLE_* enums, member-discriminated parts) and the v0.3
 * shapes (message/send, kind fields). Always replies with a Message, never a
 * Task, so there is nothing to poll, cancel or store. Rate limiting belongs
 * at the edge.
 */
export const prerender = false;

const MAX_BODY_BYTES = 16 * 1024;
const MAX_TEXT_CHARS = 2000;

const CORS: Record<string, string> = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Accept, A2A-Version, A2A-Extensions",
	"Access-Control-Max-Age": "86400",
};

const ERR = {
	parse: -32700,
	request: -32600,
	method: -32601,
	params: -32602,
	internal: -32603,
	taskNotFound: -32001,
	pushUnsupported: -32003,
	unsupportedOperation: -32004,
} as const;

type Id = string | number | null;

const rpcError = (id: Id, code: number, message: string, status = 200) =>
	new Response(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }), {
		status,
		headers: { "Content-Type": "application/json", ...CORS },
	});

const rpcResult = (id: Id, result: unknown) =>
	new Response(JSON.stringify({ jsonrpc: "2.0", id, result }), {
		headers: { "Content-Type": "application/json", "A2A-Version": "1.0", ...CORS },
	});

/** Preferred language from Accept-Language, among the supported locales. */
function localeFromHeader(header: string | null): Locale | undefined {
	for (const part of (header ?? "").split(",")) {
		const base = part.trim().split(";")[0]?.toLowerCase().split("-")[0];
		if (base === "pt") return "pt-br";
		if (base === "es") return "es";
		if (base === "en") return "en";
	}
}

const STREAMING = new Set(["SendStreamingMessage", "message/stream", "SubscribeToTask", "tasks/resubscribe"]);
const TASKS = new Set(["GetTask", "tasks/get", "CancelTask", "tasks/cancel", "ListTasks", "tasks/list"]);
const PUSH = /(PushNotificationConfig|pushNotificationConfig)/;

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: CORS });

export const GET: APIRoute = () =>
	new Response("Use POST with a JSON-RPC 2.0 request. Agent card: /.well-known/agent-card.json", {
		status: 405,
		headers: { Allow: "POST, OPTIONS", ...CORS },
	});

export const POST: APIRoute = async ({ request, url }) => {
	const declared = Number(request.headers.get("content-length") ?? 0);
	if (declared > MAX_BODY_BYTES) return rpcError(null, ERR.request, "Request too large", 413);
	const raw = await request.text();
	if (raw.length > MAX_BODY_BYTES) return rpcError(null, ERR.request, "Request too large", 413);

	let body: unknown;
	try {
		body = JSON.parse(raw);
	} catch {
		return rpcError(null, ERR.parse, "Invalid JSON payload");
	}
	const req = body as { jsonrpc?: unknown; id?: unknown; method?: unknown; params?: any };
	const id: Id = typeof req?.id === "string" || typeof req?.id === "number" ? req.id : null;
	if (!req || typeof req !== "object" || req.jsonrpc !== "2.0" || typeof req.method !== "string") {
		return rpcError(id, ERR.request, "Request payload validation error");
	}

	const method = req.method;
	if (method !== "SendMessage" && method !== "message/send") {
		if (STREAMING.has(method)) return rpcError(id, ERR.unsupportedOperation, "Streaming is not supported");
		if (TASKS.has(method)) {
			return rpcError(id, ERR.taskNotFound, "No tasks are kept: every reply is a complete message");
		}
		if (PUSH.test(method)) return rpcError(id, ERR.pushUnsupported, "Push notifications are not supported");
		return rpcError(id, ERR.method, "Method not found");
	}

	const message = req.params?.message;
	const role = message?.role;
	const parts: unknown[] = Array.isArray(message?.parts) ? message.parts : [];
	const question = parts
		.map((p) => (p && typeof (p as { text?: unknown }).text === "string" ? (p as { text: string }).text : ""))
		.filter(Boolean)
		.join("\n")
		.trim();
	if (!message || (role !== "ROLE_USER" && role !== "user") || typeof message.messageId !== "string") {
		return rpcError(id, ERR.params, "message needs a messageId and role ROLE_USER");
	}
	if (!question) return rpcError(id, ERR.params, "message.parts needs at least one text part");
	if (question.length > MAX_TEXT_CHARS) {
		return rpcError(id, ERR.params, `Text is limited to ${MAX_TEXT_CHARS} characters`);
	}

	const requested = message.metadata?.locale ?? req.params?.metadata?.locale;
	const locale: Locale = isLocale(requested)
		? requested
		: (localeFromHeader(request.headers.get("accept-language")) ?? DEFAULT_LOCALE);

	let answer: string;
	try {
		answer = await respond(url.origin, question, locale);
	} catch (error) {
		console.error(JSON.stringify({ event: "a2a_error", message: String(error) }));
		return rpcError(id, ERR.internal, "Internal error");
	}

	const contextId = typeof message.contextId === "string" ? message.contextId : undefined;
	const messageId = crypto.randomUUID();

	if (method === "message/send") {
		return rpcResult(id, {
			kind: "message",
			messageId,
			...(contextId ? { contextId } : {}),
			role: "agent",
			parts: [{ kind: "text", text: answer }],
		});
	}
	return rpcResult(id, {
		message: {
			messageId,
			...(contextId ? { contextId } : {}),
			role: "ROLE_AGENT",
			parts: [{ text: answer, mediaType: "text/markdown" }],
		},
	});
};
