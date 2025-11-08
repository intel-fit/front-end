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
  const outerStart = polarToCartesian(center, center, outerRadius, startAngle);
  const outerEnd = polarToCartesian(center, center, outerRadius, endAngle);
  const innerEnd = polarToCartesian(center, center, innerRadius, endAngle);
  const innerStart = polarToCartesian(center, center, innerRadius, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

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
  const center = size / 2;
  const outerRadius = center;
  const innerRadius = outerRadius - thickness;

  const normalizedSegments = segments
    .map((segment) => ({
      ...segment,
      percentage: clampPercentage(segment.percentage),
    }))
    .filter((segment) => segment.percentage > 0);

  if (normalizedSegments.length === 0) {
    return null;
  }

  let cumulative = 0;
  const paths = normalizedSegments.map((segment, index) => {
    const startAngle = cumulative * 360;
    const angle = segment.percentage * 3.6;
    const endAngle = startAngle + angle;
    cumulative += segment.percentage / 100;

    return (
      <Path
        key={`${segment.color}-${index}`}
        d={describeDonutSegment(center, outerRadius, innerRadius, startAngle, endAngle)}
        fill={segment.color}
      />
    );
  });

  return (
    <Svg width={size} height={size} style={style}>
      <Circle
        cx={center}
        cy={center}
        r={outerRadius - thickness / 2}
        stroke={backgroundColor}
        strokeWidth={thickness}
        fill="transparent"
      />
      {paths}
    </Svg>
  );
};

export default MacroDonut;

