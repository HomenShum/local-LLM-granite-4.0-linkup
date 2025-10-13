import { marked } from "marked";
import DOMPurify from "dompurify";

import BotIcon from "./icons/BotIcon";
import UserIcon from "./icons/UserIcon";

import "./Chat.css";
import { useEffect } from "react";

function render(text) {
  return DOMPurify.sanitize(marked.parse(text));
}

export default function Chat({ messages }) {
  const empty = messages.length === 0;

  useEffect(() => {
    window.MathJax.typeset();
  }, [messages]);

  return (
    <div
      className={`flex-1 p-6 max-w-[960px] w-full ${empty ? "flex flex-col items-center justify-end" : "space-y-4"}`}
    >
      {empty ? (
        <div className="text-xl">Ready!</div>
      ) : (
        messages.map((msg, i) => (
          <div key={`message-${i}`} className="flex items-start space-x-4">
            {msg.role === "assistant" ? (
              <>
                <BotIcon className="h-6 w-6 min-h-6 min-w-6 my-3 text-gray-500 dark:text-gray-300" />
                <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4">
                  {/* Tool calling indicator */}
                  {msg.toolCalling && msg.tools && (
                    <div className="mb-3 p-2 bg-blue-100 dark:bg-blue-900 rounded text-sm">
                      <span className="font-semibold">🔧 Calling tools:</span>{" "}
                      {msg.tools.join(", ")}
                    </div>
                  )}

                  {/* Tool results */}
                  {msg.toolResults && msg.toolResults.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {msg.toolResults.map((tr, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded text-sm ${
                            tr.success
                              ? "bg-green-100 dark:bg-green-900"
                              : "bg-red-100 dark:bg-red-900"
                          }`}
                        >
                          <div className="font-semibold">
                            {tr.success ? "✓" : "✗"} {tr.toolName}
                          </div>
                          <div className="text-xs mt-1 opacity-80">
                            {tr.result.substring(0, 200)}
                            {tr.result.length > 200 ? "..." : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Main content */}
                  <p className="min-h-6 text-gray-800 dark:text-gray-200 overflow-wrap-anywhere">
                    {msg.content.length > 0 ? (
                      <span
                        className="markdown"
                        dangerouslySetInnerHTML={{
                          __html: render(msg.content),
                        }}
                      />
                    ) : (
                      <span className="h-6 flex items-center gap-1">
                        <span className="w-2.5 h-2.5 bg-gray-600 dark:bg-gray-300 rounded-full animate-pulse"></span>
                        <span className="w-2.5 h-2.5 bg-gray-600 dark:bg-gray-300 rounded-full animate-pulse animation-delay-200"></span>
                        <span className="w-2.5 h-2.5 bg-gray-600 dark:bg-gray-300 rounded-full animate-pulse animation-delay-400"></span>
                      </span>
                    )}
                  </p>
                </div>
              </>
            ) : (
              <>
                <UserIcon className="h-6 w-6 min-h-6 min-w-6 my-3 text-gray-500 dark:text-gray-300" />
                <div className="bg-blue-500 text-white rounded-lg p-4">
                  <p className="min-h-6 overflow-wrap-anywhere">
                    {msg.content}
                  </p>
                </div>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}
