import { useState, type ComponentType, type ReactNode } from "react";
import {
  Activity,
  CheckCircle,
  Copy,
  Download,
  EllipsisVertical,
  Eye,
  KeyRound,
  Mail,
  MessageCircle,
  PackageCheck,
  Pencil,
  Printer,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
  Wallet,
  type LucideProps,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const ACTION_ICONS = {
  view: Eye,
  edit: Pencil,
  delete: Trash2,
  download: Download,
  print: Printer,
  duplicate: Copy,
  email: Mail,
  whatsapp: MessageCircle,
  resetPassword: KeyRound,
  activate: UserCheck,
  deactivate: UserX,
  permissions: ShieldCheck,
  approve: CheckCircle,
  receive: PackageCheck,
  payment: Wallet,
  activity: Activity,
  more: EllipsisVertical,
} as const;

export type ActionIconName = keyof typeof ACTION_ICONS;

export type ActionTone = "neutral" | "danger" | "primary";

const toneClass: Record<ActionTone, string> = {
  neutral: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  danger: "text-red-600 hover:bg-red-50 hover:text-red-700",
  primary: "text-[#2F6BFF] hover:bg-[#EAF0FF] hover:text-[#2558d9]",
};

export function ActionIconButton({
  icon: Icon,
  label,
  onClick,
  tone = "neutral",
  disabled = false,
  className,
}: {
  icon: ComponentType<LucideProps>;
  label: string;
  onClick?: () => void;
  tone?: ActionTone;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className={cn(
              "h-8 w-8 shrink-0 rounded-lg focus-visible:ring-2 focus-visible:ring-[#2F6BFF]/40",
              toneClass[tone],
              disabled && "opacity-40",
              className,
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="rounded-md px-2 py-1 text-xs">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export type RowActionItem = {
  id: string;
  label: string;
  icon: ComponentType<LucideProps>;
  onSelect: () => void;
  tone?: ActionTone;
  disabled?: boolean;
  disabledReason?: string;
};

export function RowActionsMenu({
  items,
  align = "end",
}: {
  items: RowActionItem[];
  align?: "start" | "end" | "center";
}) {
  const visible = items.filter(Boolean);
  if (visible.length === 0) return null;

  return (
    <DropdownMenu>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="More actions"
                className={cn(
                  "h-8 w-8 shrink-0 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-[#2F6BFF]/40",
                )}
              >
                <EllipsisVertical className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="top" className="rounded-md px-2 py-1 text-xs">
            More actions
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent align={align} className="w-48 rounded-xl p-1.5">
        {visible.map((item, index) => (
          <div key={item.id}>
            {item.tone === "danger" && index > 0 ? (
              <DropdownMenuSeparator />
            ) : null}
            <DropdownMenuItem
              disabled={item.disabled ?? false}
              {...(item.disabled && item.disabledReason
                ? { title: item.disabledReason }
                : {})}
              className={cn(
                "gap-2 rounded-lg",
                item.tone === "danger" && "text-danger focus:text-danger",
              )}
              onSelect={() => {
                if (item.disabled) return;
                item.onSelect();
              }}
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function RowActionsBar({
  primary = [],
  menuItems = [],
  className,
}: {
  primary?: Array<{
    id: string;
    label: string;
    icon: ComponentType<LucideProps>;
    onClick: () => void;
    tone?: ActionTone;
    disabled?: boolean;
  }>;
  menuItems?: RowActionItem[];
  className?: string;
}) {
  return (
    <div
      className={cn("inline-flex items-center justify-end gap-0.5", className)}
    >
      {primary.map((action) => (
        <ActionIconButton
          key={action.id}
          icon={action.icon}
          label={action.label}
          onClick={action.onClick}
          tone={action.tone ?? "neutral"}
          disabled={action.disabled ?? false}
        />
      ))}
      {menuItems.length > 0 ? <RowActionsMenu items={menuItems} /> : null}
    </div>
  );
}

/** Compact enterprise table cell/header classes. */
export const TABLE_HEAD_CLASS =
  "whitespace-nowrap px-3 py-2.5 text-xs font-semibold text-muted-foreground";
export const TABLE_CELL_CLASS =
  "whitespace-nowrap px-3 py-2.5 align-middle text-sm";
export const TABLE_ROW_CLASS =
  "border-t border-border/70 transition-colors hover:bg-muted/40";
export const TABLE_ACTION_CELL_CLASS =
  "w-[108px] whitespace-nowrap px-2 py-2 text-right align-middle";

export function TruncateWithTooltip({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  return (
    <TooltipProvider delayDuration={250}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("block max-w-[220px] truncate", className)}>
            {value}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs break-words text-xs">
          {value}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function formatCompactDate(value?: string | null) {
  if (!value || value === "—") return "—";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(parsed));
}

export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            className={cn(
              "rounded-xl",
              destructive
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-[#2F6BFF] hover:bg-[#2558d9]",
            )}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function useConfirmAction() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    destructive: boolean;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    confirmLabel: "Confirm",
    destructive: false,
    onConfirm: () => undefined,
  });

  const ask = (input: {
    title: string;
    description: string;
    confirmLabel?: string;
    destructive?: boolean;
    onConfirm: () => void;
  }) => {
    setState({
      open: true,
      title: input.title,
      description: input.description,
      confirmLabel: input.confirmLabel ?? "Confirm",
      destructive: input.destructive ?? false,
      onConfirm: input.onConfirm,
    });
  };

  const dialog = (
    <ConfirmActionDialog
      open={state.open}
      onOpenChange={(open) => setState((current) => ({ ...current, open }))}
      title={state.title}
      description={state.description}
      confirmLabel={state.confirmLabel}
      destructive={state.destructive}
      onConfirm={() => {
        state.onConfirm();
        setState((current) => ({ ...current, open: false }));
      }}
    />
  );

  return { ask, dialog };
}
