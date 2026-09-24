import { createFileRoute } from "@tanstack/react-router";
import { ErpShell } from "@/components/Erp";

export const Route = createFileRoute("/erp")({
  component: ErpShell,
});
