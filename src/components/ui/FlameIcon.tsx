import React from "react";
import Svg, { Path } from "react-native-svg";

type FlameIconProps = {
  size?: number;
  color?: string;
  secondaryColor?: string;
  opacity?: number;
};

export function FlameIcon({
  size = 24,
  color = "#F59E0B",
  secondaryColor = "#FDE68A",
  opacity = 1,
}: FlameIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none" opacity={opacity}>
      <Path
        d="M17.4 2.5c.8 5.1-2.1 7.1-4.5 9.5-2.2 2.2-3.5 4.3-3.5 7.3 0 4 3 7.2 7 7.2 4.9 0 8.1-3.5 8.1-8.2 0-4-2.4-8.5-7.1-15.8Z"
        fill={color}
      />
      <Path
        d="M14.9 16.1c1.9-1.8 2.7-3.3 2.2-5.5 2.7 2.7 4 5.4 4 7.8 0 2.9-1.8 5-4.4 5-2.2 0-3.7-1.7-3.7-3.9 0-1.3.6-2.3 1.9-3.4Z"
        fill={secondaryColor}
      />
    </Svg>
  );
}
