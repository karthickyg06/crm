import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-right"
      closeButton
      expand
      visibleToasts={4}
      gap={10}
      offset={{ top: 16, right: 16 }}
      mobileOffset={{ top: 12, right: 12, left: 12 }}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            "yaglob-toast group toast group-[.toaster]:pointer-events-auto",
          title: "yaglob-toast-title",
          description: "yaglob-toast-description",
          closeButton: "yaglob-toast-close",
          success: "yaglob-toast-success",
          error: "yaglob-toast-error",
          warning: "yaglob-toast-warning",
          info: "yaglob-toast-info",
        },
      }}
      icons={{
        success: (
          <span className="yaglob-toast-icon yaglob-toast-icon-success">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          </span>
        ),
        error: (
          <span className="yaglob-toast-icon yaglob-toast-icon-error">
            <XCircle className="h-4 w-4" aria-hidden="true" />
          </span>
        ),
        warning: (
          <span className="yaglob-toast-icon yaglob-toast-icon-warning">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          </span>
        ),
        info: (
          <span className="yaglob-toast-icon yaglob-toast-icon-info">
            <Info className="h-4 w-4" aria-hidden="true" />
          </span>
        ),
      }}
      {...props}
    />
  );
};

export { Toaster };
