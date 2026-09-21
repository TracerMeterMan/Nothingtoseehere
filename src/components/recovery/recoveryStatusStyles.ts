import { RecoveryStatus } from "../../models/muscle";
import { theme } from "../../theme/theme";

export function getRecoveryStatusColors(status: RecoveryStatus) {
  if (status === "ready") {
    return {
      background: theme.colors.accentSoft,
      foreground: theme.colors.accent,
    };
  }

  if (status === "high") {
    return {
      background: theme.colors.dangerSoft,
      foreground: theme.colors.danger,
    };
  }

  return {
    background: theme.colors.warningSoft,
    foreground: theme.colors.warning,
  };
}
