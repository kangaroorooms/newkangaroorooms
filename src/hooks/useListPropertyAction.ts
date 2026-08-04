import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/auth.api";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setCredentials } from "../store/slices/auth.slice";
import { showToast } from "../store/slices/ui.slice";

type UseListPropertyActionProps = {
  onRequirePhone?: () => void;
};

export function useListPropertyAction({
  onRequirePhone,
}: UseListPropertyActionProps = {}) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [isUpgradingToOwner, setIsUpgradingToOwner] = useState(false);
  const [isOwnerUpgradeConfirmOpen, setIsOwnerUpgradeConfirmOpen] =
    useState(false);

  const shouldShowListProperty = user?.role?.toUpperCase() !== "OWNER";

  const handleListPropertyClick = () => {
    if (isUpgradingToOwner) {
      return;
    }

    if (!user) {
      onRequirePhone?.();
      return;
    }

    const role = user.role?.toUpperCase();

    if (role === "OWNER") {
      navigate("/owner/dashboard");
      return;
    }

    if (role === "TENANT") {
      setIsOwnerUpgradeConfirmOpen(true);
      return;
    }

    onRequirePhone?.();
  };

  const closeOwnerUpgradeConfirm = () => {
    if (!isUpgradingToOwner) {
      setIsOwnerUpgradeConfirmOpen(false);
    }
  };

  const confirmOwnerUpgrade = async (phone?: string) => {
    if (isUpgradingToOwner) {
      return;
    }

    if (!user) {
      setIsOwnerUpgradeConfirmOpen(false);
      onRequirePhone?.();
      return;
    }

    const role = user.role?.toUpperCase();

    if (role === "OWNER") {
      setIsOwnerUpgradeConfirmOpen(false);
      navigate("/owner/dashboard");
      return;
    }

    if (role !== "TENANT") {
      setIsOwnerUpgradeConfirmOpen(false);
      onRequirePhone?.();
      return;
    }

    setIsUpgradingToOwner(true);
    try {
      const result = await authApi.requestOwnerAccess(phone);
      
      // Handle different response actions
      if (result.action === "SWITCH_TO_OWNER" && result.data.user && result.data.token) {
        // Switch to existing owner account
        dispatch(setCredentials({ user: result.data.user, token: result.data.token }));
        setIsOwnerUpgradeConfirmOpen(false);
        dispatch(
          showToast({
            message: "Switched to existing owner account.",
            type: "success",
          }),
        );
        navigate("/owner/dashboard");
      } else if (result.action === "UPGRADE_TO_OWNER" && result.data.user && result.data.token) {
        // Upgrade current tenant to owner
        dispatch(setCredentials({ user: result.data.user, token: result.data.token }));
        setIsOwnerUpgradeConfirmOpen(false);
        dispatch(
          showToast({
            message: "Owner access enabled. You can now list your property.",
            type: "success",
          }),
        );
        navigate("/owner/dashboard");
      } else if (result.action === "ALREADY_OWNER" && result.data.user && result.data.token) {
        // Already owner
        dispatch(setCredentials({ user: result.data.user, token: result.data.token }));
        setIsOwnerUpgradeConfirmOpen(false);
        navigate("/owner/dashboard");
      } else if (result.action === "PHONE_REQUIRED") {
        // Phone required - this shouldn't happen if modal is shown correctly
        setIsOwnerUpgradeConfirmOpen(false);
        dispatch(
          showToast({
            message: "Phone number required. Please try again.",
            type: "error",
          }),
        );
      }
    } catch (error: any) {
      setIsOwnerUpgradeConfirmOpen(false);
      dispatch(
        showToast({
          message:
            error?.response?.data?.message ||
            "Unable to enable owner access. Please try again.",
          type: "error",
        }),
      );
    } finally {
      setIsUpgradingToOwner(false);
    }
  };

  return {
    user,
    shouldShowListProperty,
    handleListPropertyClick,
    isUpgradingToOwner,
    isOwnerUpgradeConfirmOpen,
    closeOwnerUpgradeConfirm,
    confirmOwnerUpgrade,
  };
}
