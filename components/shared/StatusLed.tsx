import Image from 'next/image';

const LED_SOURCES = {
  red: '/assets/ui/status-led/status-led-red.png',
  blue: '/assets/ui/status-led/status-led-blue.png',
  purple: '/assets/ui/status-led/status-led-purple.png',
  yellow: '/assets/ui/status-led/status-led-yellow.png',
  green: '/assets/ui/status-led/status-led-green.png',
} as const;

const LED_SIZES = {
  sm: 12,
  md: 20,
  lg: 28,
} as const;

export type StatusLedColor = keyof typeof LED_SOURCES;
export type StatusLedSize = keyof typeof LED_SIZES;

type StatusLedProps = {
  color: StatusLedColor;
  size?: StatusLedSize;
  label?: string;
  className?: string;
  animated?: boolean;
};

export function StatusLed({
  color,
  size = 'sm',
  label,
  className = '',
  animated = false,
}: StatusLedProps) {
  const dimension = LED_SIZES[size];

  const classes = [
    'statusLed',
    `statusLed--${color}`,
    animated ? 'statusLed--animated' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={classes}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{
        '--status-led-size': `${dimension}px`,
      } as React.CSSProperties}
    >
      <Image
        src={LED_SOURCES[color]}
        alt=""
        width={dimension}
        height={dimension}
        className="statusLed__image"
        sizes={`${dimension}px`}
      />
    </span>
  );
}