import * as React from "react";
import { cn } from "@/lib/utils";

export interface AutoExpandingTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxRows?: number;
  minRows?: number;
}

const AutoExpandingTextarea = React.forwardRef<
  HTMLTextAreaElement,
  AutoExpandingTextareaProps
>(({ className, maxRows = 10, minRows = 1, ...props }, ref) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Combine refs
  React.useImperativeHandle(ref, () => textareaRef.current!);

  const adjustHeight = React.useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = "auto";

    // Calculate line height
    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight =
      parseInt(computedStyle.lineHeight) ||
      parseInt(computedStyle.fontSize) * 1.2;

    // Calculate min and max heights - align with button height (40px)
    const minHeight = Math.max(lineHeight * minRows, 40); // Match button height of 40px
    const maxHeight = lineHeight * maxRows;

    // Set the height based on content, but within min/max bounds
    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);

    textarea.style.height = `${newHeight}px`;

    // Enable scrolling if content exceeds max height
    if (scrollHeight > maxHeight) {
      textarea.style.overflowY = "auto";
    } else {
      textarea.style.overflowY = "hidden";
    }
  }, [maxRows, minRows]);

  // Adjust height on mount and when value changes
  React.useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      adjustHeight();
    });
  }, [props.value, adjustHeight]);

  // Adjust height on initial mount
  React.useEffect(() => {
    requestAnimationFrame(() => {
      adjustHeight();
    });
  }, [adjustHeight]);

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    adjustHeight();
    if (props.onInput) {
      props.onInput(e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow Shift+Enter for new lines, Enter alone to submit (if parent handles it)
    if (e.key === "Enter" && !e.shiftKey) {
      // Let the parent component handle the submit logic
      // We'll just prevent the default to avoid adding a new line
      if (props.onKeyDown) {
        props.onKeyDown(e);
      }
    } else if (props.onKeyDown) {
      props.onKeyDown(e);
    }
  };

  return (
    <div className="relative">
      <textarea
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all duration-150",
          className
        )}
        ref={textareaRef}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        {...props}
      />
    </div>
  );
});
AutoExpandingTextarea.displayName = "AutoExpandingTextarea";

export { AutoExpandingTextarea };
