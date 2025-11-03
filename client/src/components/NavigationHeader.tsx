import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Bell, Sprout, ChevronDown, LogOut, User, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

// IMPORT your form components (update paths if needed)
import { DistributorProductForm } from "./DistributorProductForm";
import { RetailerProductForm } from "./RetailerProductForm";
import { OwnershipManagementPanel } from "./OwnershipManagementPanel"; // Import at the top

export function NavigationHeader() {
  const [location, setLocation] = useLocation();
  const { user, firebaseUser, logout, loading } = useAuth();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // modal states (we'll show forms as overlays)
  const [showDistributorForm, setShowDistributorForm] = useState(false);
  const [showRetailerForm, setShowRetailerForm] = useState(false);
  const [showOwnershipPanel, setShowOwnershipPanel] = useState(false); // <-- new state

  // pending product id so we can redirect after form submit
  const [pendingProductIdForRedirect, setPendingProductIdForRedirect] =
    useState<string | null>(null);

  // store the transfer id & product id for the currently-open form
  const [currentTransferForForm, setCurrentTransferForForm] = useState<{
    transferId?: string;
    productId?: string;
  } | null>(null);

  const [productData, setProductData] = useState<any>(null);

  const [ownershipPanelPrefill, setOwnershipPanelPrefill] = useState<{
    productId?: string;
    toUserId?: string;
    transferId?: string;
    mode?: "product_request" | "simple_transfer";
  } | null>(null); // <-- new state

  const isActiveRoute = (path: string) => location === path;

  // Fetch unread notifications (we keep only unread in dropdown)
  useEffect(() => {
    let mounted = true;
    async function fetchNotifications() {
      if (!firebaseUser) return;
      try {
        const idToken = await firebaseUser.getIdToken();
        const res = await fetch("/api/notifications", {
          headers: {
            "firebase-uid": firebaseUser.uid,
            Authorization: `Bearer ${idToken}`,
          },
        });
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          setNotifications(data || []); // Keep all notifications
          setNotificationCount((data || []).filter((n: any) => !n.read).length); // Only unread count
        } else {
          setNotifications([]);
          setNotificationCount(0);
        }
      } catch (err) {
        if (!mounted) return;
        setNotifications([]);
        setNotificationCount(0);
      }
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 2000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [firebaseUser]);

  // Prevent background scroll & avoid layout shift when modal opens.
  useEffect(() => {
    const modalOpen = showDistributorForm || showRetailerForm;
    if (!modalOpen) {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      return;
    }

    // compute scrollbar width so content doesn't jump
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [showDistributorForm, showRetailerForm]);

  // When opening the modal, fetch product data if productId exists
  useEffect(() => {
    if (currentTransferForForm?.productId) {
      fetch(`/api/products/${currentTransferForForm.productId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => setProductData(data))
        .catch(() => setProductData(null));
    } else {
      setProductData(null);
    }
  }, [currentTransferForForm]);

  if (loading) {
    return (
      <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center h-16 items-center">
            <div className="animate-pulse">KrishiSetu...</div>
          </div>
        </div>
      </nav>
    );
  }

  if (!user || !firebaseUser) {
    return (
      <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-between items-center h-16 gap-2">
            <div className="flex flex-wrap items-center gap-4 flex-grow min-w-0">
              <div className="flex-shrink-0">
                <h1
                  className="text-2xl font-bold text-primary flex items-center gap-2 cursor-pointer hover:opacity-80"
                  onClick={() => setLocation("/dashboard")}
                  style={{ userSelect: "none" }}
                  data-testid="logo-home"
                >
                  <Sprout className="w-6 h-6" />
                  KrishiSetu
                </h1>
              </div>

              <div className="hidden md:flex space-x-4 min-w-0 flex-shrink">
                <Link
                  href="/dashboard"
                  className="px-3 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:text-foreground"
                  data-testid="link-dashboard"
                >
                  Dashboard
                </Link>
                <Link
                  href="/qr-scanner"
                  className="px-3 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:text-foreground"
                  data-testid="link-scanner"
                >
                  QR Scanner
                </Link>
                <Link
                  href="/registered-products"
                  className="px-3 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:text-foreground"
                  data-testid="link-registered-products"
                >
                  Registered Products
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <Button
                onClick={() => setLocation("/login")}
                data-testid="button-login"
                className="whitespace-nowrap"
              >
                Sign In/Up
              </Button>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const navLinks = [
    {
      href: "/dashboard",
      label: "Dashboard",
      show: true,
      testid: "link-dashboard",
    },
    {
      href: "/qr-scanner",
      label: "QR Scanner",
      show: true,
      testid: "link-scanner",
    },
    {
      href: "/registered-products",
      label: "Registered Products",
      show: ["farmer", "distributor", "retailer"].includes(user.role),
      testid: "link-registered-products",
    },
    {
      href: "/scanned-products",
      label: "Scanned Products",
      show: user.role === "consumer",
      testid: "link-scanned-products",
    },
    {
      href: "/request-products",
      label: "Request Product",
      show: user.role === "retailer" || user.role === "distributor",
      testid: "link-request-products",
    },
  ];

  // Remove notification locally (we assume server has been notified already)
  const removeNotificationLocal = (notifId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    setNotificationCount((prev) => Math.max(0, prev - 1));
  };

  // Accept ownership: mark read & respond server-side, remove locally, open modal form
  const handleAcceptOwnership = async (notif: any) => {
    if (!firebaseUser) return;
    try {
      const idToken = await firebaseUser.getIdToken();

      // mark as read server-side
      await fetch(`/api/notifications/${notif.id}/read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "firebase-uid": user?.firebaseUid || "",
          Authorization: `Bearer ${idToken}`,
        },
      });

      // tell backend we accepted the invitation (this keeps server in sync)
      await fetch(`/api/notifications/${notif.id}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "firebase-uid": user?.firebaseUid || "",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ action: "accepted", role: user.role }),
      });

      // remove locally from dropdown
      removeNotificationLocal(notif.id);

      // FLOW 2: Product request (requester → owner)
      if (notif.type === "product_request" && notif.fromUserId) {
        setOwnershipPanelPrefill({
          productId: notif.productId,
          toUserId: notif.fromUserId,
          transferId: notif.transferId ?? notif.id,
          mode: "product_request",
        });
        setShowOwnershipPanel(true);
        return;
      }

      // FLOW 1: Dashboard transfer (owner → recipient)
      setPendingProductIdForRedirect(notif.productId ?? null);
      setCurrentTransferForForm({
        transferId: notif.transferId ?? notif.id,
        productId: notif.productId,
      });

      if (user.role === "distributor") {
        setShowDistributorForm(true);
      } else if (user.role === "retailer") {
        setShowRetailerForm(true);
      } else {
        if (notif.productId) setLocation(`/product/${notif.productId}`);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Action failed",
        description: "Could not accept ownership at the moment. Try again.",
        variant: "destructive",
      });
    }
  };

  // Reject ownership: inform backend, remove locally
  const handleRejectOwnership = async (notif: any) => {
    if (!firebaseUser) return;
    try {
      const idToken = await firebaseUser.getIdToken();

      await fetch(`/api/notifications/${notif.id}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "firebase-uid": user?.firebaseUid || "",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ action: "rejected", role: user.role }),
      });

      // remove locally
      removeNotificationLocal(notif.id);

      toast({
        title: "Request rejected",
        description: "You rejected the ownership request.",
      });
    } catch (err) {
      console.error("Error rejecting ownership:", err);
      toast({
        title: "Action failed",
        description: "Could not reject ownership. Please try again.",
        variant: "destructive",
      });
    }
  };
  const markNotificationReadLocal = (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => n.id === notifId ? { ...n, read: true } : n)
    );
    setNotificationCount((prev) => Math.max(0, prev - 1));
  };
  // Default click behaviour for non-ownership notifications:
  // mark read server-side and navigate to product page.
  // For ownership notifications, DO NOT mark read or remove here — the user must Accept/Reject.
  const handleNotificationClick = async (notif: any) => {
    const isOwnership =
      notif.type === "ownership_request" ||
      notif.type === "product_request" ||
      notif.requestType === "ownership" ||
      notif.ownershipRequest === true;

    if (isOwnership) {
      // keep it until explicit Accept/Reject
      return;
    }

    if (!firebaseUser) return;
    try {
      await fetch(`/api/notifications/${notif.id}/read`, {
        method: "PUT",
        headers: {
          "firebase-uid": user?.firebaseUid || "",
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      // ignore server error for read
    }

    markNotificationReadLocal(notif.id);

    if (notif.productId) {
      setLocation(`/product/${notif.productId}`);
    }
  };

  // When form modal closes. result?: { submitted?: boolean, productId?: string }
  const handleFormClose = (result?: {
    submitted?: boolean;
    productId?: string;
  }) => {
    setShowDistributorForm(false);
    setShowRetailerForm(false);

    // choose redirect target: prefer explicit productId from result, otherwise pendingProductIdForRedirect
    const targetProductId = result?.productId ?? pendingProductIdForRedirect;

    if (result?.submitted && targetProductId) {
      setLocation(`/product/${targetProductId}`);
    }

    // cleanup
    setPendingProductIdForRedirect(null);
    setCurrentTransferForForm(null);
  };

  const sortedNotifications = [...notifications]; // they're unread only

  return (
    <>
      <nav className="bg-card border-b border-border sticky top-0 z-50 shadow-sm w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-between items-center h-16 gap-2">
            {/* Left: Logo + nav links */}
            <div className="flex flex-wrap items-center gap-4 flex-grow min-w-0">
              <div className="flex-shrink-0">
                <h1
                  className="text-2xl font-bold text-primary flex items-center gap-2 cursor-pointer hover:opacity-80"
                  onClick={() => setLocation("/dashboard")}
                  style={{ userSelect: "none" }}
                  data-testid="logo-home"
                >
                  <Sprout className="w-6 h-6" />
                  KrishiSetu
                </h1>
              </div>

              <div className="hidden md:flex space-x-2 min-w-0 flex-shrink">
                {navLinks
                  .filter((link) => link.show)
                  .map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActiveRoute(link.href)
                          ? "text-primary border-b-2 border-primary bg-muted"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      } truncate`}
                      data-testid={link.testid}
                    >
                      {link.label}
                    </Link>
                  ))}
              </div>
            </div>

            {/* Right: Notifications, user menu, mobile toggle */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <DropdownMenu
                open={notifDropdownOpen}
                onOpenChange={setNotifDropdownOpen}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    data-testid="button-notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {notificationCount > 0 && (
                      <span
                        className="absolute -top-1 -right-1 h-5 w-5 bg-accent text-accent-foreground rounded-full text-xs flex items-center justify-center"
                        data-testid="text-notification-count"
                      >
                        {notificationCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-80 max-h-96 overflow-auto"
                >
                  <div className="p-2 font-semibold">Notifications</div>
                  <DropdownMenuSeparator />
                  {sortedNotifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No new notifications.
                    </div>
                  ) : (
                    sortedNotifications.map((notif) => {
                      const isOwnership =
                        notif.type === "ownership_request" ||
                        notif.type === "product_request" ||
                        notif.requestType === "ownership" ||
                        notif.ownershipRequest === true;

                      const isRead = notif.read;

                      // Add a class for dimming
                      const notifClass = isRead
                        ? "opacity-50" // dull and clickable
                        : "";

                      if (isOwnership) {
                        return (
                          <div
                            key={notif.id}
                            className={`p-3 border-b last:border-b-0 ${notifClass}`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">
                                  {notif.title}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {notif.message}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(notif.createdAt).toLocaleString()}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2 ml-2">
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleAcceptOwnership(notif)}
                                    data-testid={`button-accept-${notif.id}`}
                                  >
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRejectOwnership(notif)}
                                    data-testid={`button-reject-${notif.id}`}
                                  >
                                    Reject
                                  </Button>
                                </div>
                                <span className="text-xs text-accent">
                                  Pending
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <DropdownMenuItem
                          key={notif.id}
                          onClick={() => !isRead && handleNotificationClick(notif)}
                          style={{ cursor: isRead ? "default" : "pointer" }}
                          className={notifClass}
                        >
                          <div>
                            <div className="font-medium">{notif.title}</div>
                            <div className="text-xs">{notif.message}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(notif.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </DropdownMenuItem>
                      );
                    })
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted"
                    data-testid="button-user-menu"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage
                        src={firebaseUser.photoURL || undefined}
                        alt={user.name}
                      />
                      <AvatarFallback>
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left max-w-[120px] truncate">
                      <div
                        className="text-sm font-medium text-foreground truncate"
                        data-testid="text-user-name"
                        title={user.name}
                      >
                        {user.name}
                      </div>
                      <div
                        className="text-xs text-muted-foreground truncate"
                        data-testid="text-user-role"
                        title={user.role}
                      >
                        {user.role}
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <Link href="/profile">
                    <DropdownMenuItem
                      className="cursor-pointer"
                      data-testid="menu-profile"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer"
                    data-testid="menu-logout"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle menu"
                  data-testid="button-mobile-menu"
                >
                  <Menu className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-2 space-y-1 px-2 pb-3 border-t border-border">
              {navLinks
                .filter((link) => link.show)
                .map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActiveRoute(link.href)
                        ? "text-primary border-l-4 border-primary bg-muted"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                    data-testid={link.testid}
                  >
                    {link.label}
                  </Link>
                ))}
            </div>
          )}
        </div>
      </nav>

      {/* Modal overlays (fixed, centered) */}
      {(showDistributorForm || showRetailerForm) && (
        <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-auto">
          {/* backdrop with blur and semi-opaque dark layer */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              // clicking backdrop cancels forms (keep behavior consistent)
              setShowDistributorForm(false);
              setShowRetailerForm(false);
              setPendingProductIdForRedirect(null);
              setCurrentTransferForForm(null);
            }}
          />

          {/* modal panel — will not shift page content; centered, scrollable if tall */}
          <div className="relative mt-12 mb-12 mx-4 max-h-[90vh] w-full max-w-4xl overflow-auto rounded-lg bg-white p-6 shadow-2xl z-[121]">
            {showDistributorForm && currentTransferForForm && (
              <DistributorProductForm
                isVisible={true}
                onClose={(res) => handleFormClose(res)}
                transferId={currentTransferForForm.transferId}
                productData={productData}
                productId={currentTransferForForm.productId}
              />
            )}
            {showRetailerForm && currentTransferForForm && (
              <RetailerProductForm
                isVisible={true}
                onClose={(res) => handleFormClose(res)}
                transferId={currentTransferForForm.transferId}
                productData={productData}
                productId={currentTransferForForm.productId}
              />
            )}
          </div>
        </div>
      )}

      {/* Ownership Management Panel (fixed, centered) */}
      {showOwnershipPanel && (
        <OwnershipManagementPanel
          isOpen={showOwnershipPanel}
          onOpenChange={setShowOwnershipPanel}
          prefillData={ownershipPanelPrefill}
        />
      )}
    </>
  );
}

