// components/OwnershipManagementPanel.tsx
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Shield, Users, AlertCircle } from "lucide-react";
import { UserSearch } from "./UserSearch";
import { ProductSearch } from "./ProductSearch";

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
          .then((product) => {
            if (product) {
              setSelectedProduct(product);
              form.setValue("productId", product.id);
            }
          });
      }
      // Prefill user
      if (prefillData.toUserId) {
        fetch(`/api/users/${prefillData.toUserId}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((user) => {
            if (user) {
              setSelectedUser(user);
              form.setValue("toUserId", user.id);
              form.setValue("toUserName", user.name);
            }
          });
      }
      // Prefill user name if provided
      if (prefillData.toUserName) {
        form.setValue("toUserName", prefillData.toUserName);
      }
    }
  }, [isDialogOpen, prefillData]);

  const handleUserSelect = (user: any) => {
    setSelectedUser(user);
    form.setValue("toUserId", user.id);
    form.setValue("toUserName", user.name);
  };

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    form.setValue("productId", product.id);
  };

  const clearUserSelection = () => {
    setSelectedUser(null);
    form.setValue("toUserId", "");
    form.setValue("toUserName", "");
  };

  const clearProductSelection = () => {
    setSelectedProduct(null);
    form.setValue("productId", "");
  };

  const onSubmit = async (data: z.infer<typeof transferFormSchema>) => {
    if (!user) return;

    setIsSubmitting(true);

    console.log("[FRONTEND] Form data:", data);
    console.log("[FRONTEND] toUserId:", data.toUserId);
    console.log("[FRONTEND] selectedUser:", selectedUser);

    try {
      const requestBody = {
        productId: data.productId,
        toUserId: data.toUserId,
        transferType: data.transferType,
        notes: data.notes,
      };
      console.log("[FRONTEND] Request body:", requestBody);

      const response = await fetch("/api/ownership-transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "firebase-uid": user.firebaseUid,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to transfer ownership");
      }

      const result = await response.json();

      toast({
        title: "Ownership Transfer Request Sent",
        description: `A transfer request has been sent to ${data.toUserName}. They need to accept it to complete the transfer.`,
        variant: "default",
      });

      setIsDialogOpen(false);
      form.reset();
      setSelectedUser(null);
      setSelectedProduct(null);
    } catch (error: any) {
      toast({
        title: "Transfer Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="shadow-sm border border-border overflow-hidden">
        <CardHeader className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent" />
            Ownership Management
          </h3>
        </CardHeader>

        <CardContent className="p-6">
          <div className="bg-muted rounded-lg p-8 text-center relative">
            <div className="relative z-10">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Manage product ownership and transfer products securely
              </p>
              <Button
                className="bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => setIsDialogOpen(true)}
              >
                Transfer Ownership
              </Button>
            </div>
          </div>

          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Transfer requests require acceptance from the new owner
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Transfer Ownership Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Transfer Product Ownership</DialogTitle>
            <DialogDescription>
              Transfer ownership of your product to another user. They will need
              to accept the transfer.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 py-4"
            >
              <FormItem>
                <FormLabel>Your Product</FormLabel>
                {user && (
                  <ProductSearch
                    onProductSelect={handleProductSelect}
                    ownerId={user.id}
                    placeholder="Search your products by name, category, farm, or batch ID..."
                    selectedProduct={selectedProduct}
                    onClearSelection={clearProductSelection}
                  />
                )}
                <FormMessage />
              </FormItem>

              <FormItem>
                <FormLabel>Transfer To</FormLabel>
                {user && (
                  <UserSearch
                    currentUserId={user.id}
                    onUserSelect={handleUserSelect}
                    placeholder="Search users by name, username, or email..."
                    selectedUser={selectedUser}
                    onClearSelection={clearUserSelection}
                  />
                )}
                <FormMessage />
              </FormItem>

              <FormField
                control={form.control}
                name="transferType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transfer Type</FormLabel>
                    <select
                      {...field}
                      className="w-full p-2 border rounded-md"
                      required
                    >
                      <option value="transfer">Standard Transfer</option>
                      <option value="sale">Sale</option>
                      <option value="distribution">Distribution</option>
                      <option value="supply_request">Supply Request</option>
                      <option value="return">Return</option>
                    </select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        placeholder="Add notes about this transfer"
                        className="w-full p-2 border rounded-md"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    form.reset();
                    setSelectedUser(null);
                    setSelectedProduct(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !form.watch("toUserId") ||
                    !form.watch("productId")
                  }
                >
                  {isSubmitting ? "Processing..." : "Send Transfer Request"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
