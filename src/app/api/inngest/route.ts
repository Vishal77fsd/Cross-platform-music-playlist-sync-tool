import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { transferFunction } from "@/inngest/transferFunction";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [transferFunction],
});