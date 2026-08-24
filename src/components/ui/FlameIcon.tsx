import React, { useMemo } from "react";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

interface FlameIconProps {
  size?: number;
  /** Lit flames burn orange; unlit ones sit grey in the corner. */
  lit?: boolean;
  /** 0-1 scale for the inner core, used by the streak animation. */
  coreOpacity?: number;
}

const OUTER_FLAME =
  "M32 2c2 10-4 14-9 19-4 4-8 8-8 15 0 4 1 7 3 10-6-3-10-9-10-17 0-3 .4-6 1.4-9C4 24 2 30 2 38c0 14 12 24 30 24s30-10 30-24c0-13-8-22-14-27 1 6-1 10-4 12 1-9-3-17-12-21z";

const INNER_FLAME =
  "M32 26c1 6-2 8-5 11-2 3-4 5-4 9 0 6 5 10 11 10 7 0 12-5 12-11 0-8-7-14-14-19z";

export const FlameIcon: React.FC<FlameIconProps> = ({ size = 22, lit = true, coreOpacity = 1 }) => {
  // Gradient ids have to be unique or a lit flame steals an unlit one's colours.
  const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);
  const outerId = `flameOuter-${uid}`;
  const innerId = `flameInner-${uid}`;

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={outerId} x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor={lit ? "#F97316" : "#3A424E"} />
          <Stop offset="1" stopColor={lit ? "#FBBF24" : "#4A5563"} />
        </LinearGradient>
        <LinearGradient id={innerId} x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor={lit ? "#FDE68A" : "#5B6472"} />
          <Stop offset="1" stopColor={lit ? "#FFFFFF" : "#6B7480"} />
        </LinearGradient>
      </Defs>
      <Path d={OUTER_FLAME} fill={`url(#${outerId})`} />
      <Path d={INNER_FLAME} fill={`url(#${innerId})`} opacity={lit ? coreOpacity : 0.35} />
    </Svg>
  );
};

export default FlameIcon;
