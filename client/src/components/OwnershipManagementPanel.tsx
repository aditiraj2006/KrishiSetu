// components/OwnershipManagementPanel.tsx

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Shield, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getAuthHeaders } from "@/lib/authHeaders";
import { ProductSearch } from "./ProductSearch";
import { UserSearch } from "./UserSearch";

const transferFormSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  toUserId: z.string().min(1, "New owner is required"),
  toUserName: z.string().min(1, "New owner is required"),
  transferType: z.string().min(1, "Transfer type is required"),
  notes: z.string().optional(),
});

interface OwnershipManagementPanelProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  prefillData?: {
    productId?: string;
    toUserId?: string;
    toUserName?: string;
    transferId?: string;
    mode?: "product_request" | "simple_transfer";
  } | null;
}

export function OwnershipManagementPanel({
  isOpen = false,
  onOpenChange,
  prefillData,
}: OwnershipManagementPanelProps) {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(isOpen);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingData, setPendingData] = useState<z.infer<typeof transferFormSchema> | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      productId: "",
      toUserId: "",
      toUserName: "",
      transferType: "transfer",
      notes: "",
    },
  });

  useEffect(() => {
    setIsDialogOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (isDialogOpen && prefillData) {
      // Prefill product
      if (prefillData.productId) {
        fetch(`/api/products/${prefillData.productId}`)
          .then((res) => (res.ok ? res.json() : null))
          .catch(err => console.error(err))