import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface MacroSegment {
  percentage: number;
  color: string;
}

interface MacroDonutProps {
  segments: MacroSegment[];
  size?: number;
  thickness?: number;
  style?: ViewStyle;
  backgroundColor?: string;
}

const clampPercentage = (value: number) => Math.max(0, Math.min(100, value));

const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

const describeDonutSegment = (
  center: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
) => {
  // startAngle이 endAngle보다 클 수 있는 상황을 방어
  const safeStart = Math.min(startAngle, endAngle);
  const safeEnd = Math.max(startAngle, endAngle);

  const outerStart = polarToCartesian(center, center, outerRadius, safeStart);
  const outerEnd = polarToCartesian(center, center, outerRadius, safeEnd);
  const innerEnd = polarToCartesian(center, center, innerRadius, safeEnd);
  const innerStart = polarToCartesian(center, center, innerRadius, safeStart);

  const deltaAngle = Math.abs(safeEnd - safeStart);
  const largeArcFlag = deltaAngle <= 180 ? '0' : '1';

  return `
    M ${outerStart.x} ${outerStart.y}
    A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}
    L ${innerEnd.x} ${innerEnd.y}
    A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}
    Z
  `;
};

const MacroDonut: React.FC<MacroDonutProps> = ({
  segments,
  size = 96,
  thickness = 18,
  style,
  backgroundColor = '#1e1e1e',
}) => {
  const safeSize = typeof size === 'number' && size > 0 ? size : 96;
  const safeThickness =
    typeof thickness === 'number' && thickness > 0
      ? Math.min(thickness, safeSize / 2)
      : Math.min(18, safeSize / 2);

  const center = safeSize / 2;
  const outerRadius = center;
  const innerRadius = outerRadius - safeThickness;

  const normalizedSegments = segments.reduce<MacroSegment[]>((acc, segment) => {
    const percentage = clampPercentage(segment.percentage);
    if (percentage <= 0) return acc;
    acc.push({ ...segment, percentage });
    return acc;
  }, []);

  if (normalizedSegments.length === 0) {
    return null;
  }

  let cumulative = 0;
  const paths = normalizedSegments.map((segment, index) => {
    const fraction = Math.min(segment.percentage / 100, 1 - cumulative);
    const startAngle = cumulative * 360;
    const angle = fraction * 360;
    const endAngle = startAngle + angle;
    cumulative += fraction;

    if (angle <= 0) {
      return null;
    }

    return (
      <Path
        key={`${segment.color}-${index}`}
        d={describeDonutSegment(
          center,
          outerRadius,
          innerRadius,
          startAngle,
          endAngle,
        )}
        fill={segment.color}
      />
    );
  });

  return (
    <Svg width={safeSize} height={safeSize} style={style}>
      <Circle
        cx={center}
        cy={center}
        r={outerRadius - safeThickness / 2}
        stroke={backgroundColor}
        strokeWidth={safeThickness}
        fill="transparent"
      />
      {paths}
    </Svg>
  );
};

export default MacroDonut;

