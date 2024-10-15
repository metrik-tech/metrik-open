import cn from "clsx";
import * as React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  marginTop?: string;
}

export interface TextAreaProps
  extends React.InputHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
  marginTop?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mergeRefs<T = any>(
  refs: Array<React.MutableRefObject<T> | React.LegacyRef<T>>,
): React.RefCallback<T> {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref != null) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    });
  };
}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, error, label, marginTop = "mt-0", ...props }, ref) => {
    const inputRef = React.useRef<HTMLTextAreaElement>(null);
    const [isFocused, setIsFocused] = React.useState(false);
    const handleFocusChange = (isFocused: boolean) => {
      if (isFocused === false) {
        inputRef.current?.blur();
      } else {
        inputRef.current?.focus();
      }
      setIsFocused(isFocused);
    };
    return (
      <div
        className={cn("text-left")}
        onFocus={() => {
          handleFocusChange(true);
        }}
        onBlur={() => {
          handleFocusChange(false);
        }}
      >
        {label && (
          <p
            className={cn(
              "mb-1 text-xs text-neutral-600 dark:text-neutral-400",
              marginTop,
            )}
          >
            {label}
          </p>
        )}
        <div
          className={cn(
            "flex w-full min-w-[10rem] items-center overflow-hidden rounded-md border bg-transparent shadow-sm ring-0 hover:bg-neutral-50 focus:ring-2",
            className,
            error ? "border-red-500" : "border-neutral-300",
            isFocused ? "ring-2 ring-blue-300" : "",
          )}
        >
          <textarea
            className={cn(
              "h-full w-full border-0 bg-inherit px-3 py-2 text-sm font-medium text-neutral-700 placeholder:text-neutral-500 focus:outline-none focus:ring-0 scroll-pb-2 resize-none",
            )}
            ref={mergeRefs([ref, inputRef])}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  },
);
TextArea.displayName = "TextArea";

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, marginTop = "mt-0", ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = React.useState(false);
    const handleFocusChange = (isFocused: boolean) => {
      if (isFocused === false) {
        inputRef.current?.blur();
      } else {
        inputRef.current?.focus();
      }
      setIsFocused(isFocused);
    };
    return (
      <div
        className={cn("text-left")}
        onFocus={() => {
          handleFocusChange(true);
        }}
        onBlur={() => {
          handleFocusChange(false);
        }}
      >
        {label && (
          <p
            className={cn(
              "mb-1 text-xs text-neutral-600 dark:text-neutral-400",
              marginTop,
            )}
          >
            {label}
          </p>
        )}
        <div
          className={cn(
            "flex w-full min-w-[12rem] items-center overflow-hidden rounded-md border bg-transparent shadow-sm ring-0 hover:bg-neutral-50 focus:ring-2",
            className,
            error ? "border-red-500" : "border-neutral-300",
            isFocused ? "ring-2 ring-blue-300" : "",
          )}
        >
          <input
            className={cn(
              "w-full border-0 bg-inherit px-4 py-2 text-sm  text-neutral-700 placeholder:text-neutral-500 focus:outline-none focus:ring-0",
            )}
            ref={mergeRefs([ref, inputRef])}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input, TextArea };
