// src/components/chatbot/InputArea.tsx
import React from "react";

// Define SendIcon here or create Icons.tsx in chatbot folder and export it
const SendIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 17 11 13 2 22 22 2"></polygon>
  </svg>
);

interface InputAreaProps {
  inputValue: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendMessage: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isLoading: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({
  inputValue,
  onInputChange,
  onSendMessage,
  onKeyDown,
  isLoading,
}) => {
  return (
    <div className="p-4 bg-gray-200 border-t border-gray-300">
      <div className="flex items-center">
        <input
          type="text"
          placeholder="Type your message..."
          className="flex-grow rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
          value={inputValue}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          disabled={isLoading}
        />
        <button
          onClick={onSendMessage}
          className={`ml-2 p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white focus:outline-none ${
            isLoading ? "opacity-50 cursor-wait" : "cursor-pointer"
          }`}
          disabled={isLoading}
          aria-label="Send"
        >
          {isLoading ? (
            <svg
              className="animate-spin h-5 w-5 text-white"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <SendIcon className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  );
};

export default InputArea;
