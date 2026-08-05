'use client';

import {
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import geographyData from '@/app/data/net/geography.json';
import { geographyOverrides } from '@/app/data/net/geography-overrides';

type RawPoint = {
  id: string;
  sourceLabel: string;
  countryCode: string;
  matchedName: string;
  adminName1: string;
  adminName2: string;
  latitude: number;
  longitude: number;
  artistCount: number;
  artists: string[];
};

export type NetMapPoint = RawPoint & {
  mapX: number;
  mapY: number;
};

type Camera = {
  x: number;
  y: number;
  zoom: number;
};

type PointerDrag = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startCameraX: number;
  startCameraY: number;
};

type NetworkEventType =
  | 'pulse'
  | 'scan'
  | 'surge'
  | 'twin'
  | 'collective'
  | 'flash';

type NetworkEvent = {
  id: number;
  type: NetworkEventType;
  pointIds: string[];
  duration: number;
};

type Props = {
  activeArtistNames: string[];
  selectedPlaceId: string | null;
  onSelectPlace: (point: NetMapPoint | null) => void;
  autoFocusKey?: string;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
const ZOOM_STEP = 1.28;
const AUTO_FOCUS_ZOOM = 4.2;
const CAMERA_TRANSITION_MS = 720;
const MINOR_EVENT_MIN_DELAY = 30_000;
const MINOR_EVENT_MAX_DELAY = 90_000;
const MAJOR_EVENT_MIN_DELAY = 10 * 60_000;
const MAJOR_EVENT_MAX_DELAY = 15 * 60_000;

function randomBetween(minimum: number, maximum: number) {
  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

function chooseRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)] ?? null;
}

function chooseDistinct<T>(items: T[], count: number): T[] {
  const pool = [...items];
  const selected: T[] = [];

  while (pool.length > 0 && selected.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    const [item] = pool.splice(index, 1);
    if (item !== undefined) selected.push(item);
  }

  return selected;
}

function project(latitude: number, longitude: number) {
  return {
    mapX: ((longitude + 180) / 360) * 100,
    mapY: ((90 - latitude) / 180) * 100,
  };
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function mergePoints(points: RawPoint[]): NetMapPoint[] {
  const grouped = new Map<string, NetMapPoint>();

  for (const point of points) {
    const coordinateKey = `${point.latitude.toFixed(4)}:${point.longitude.toFixed(4)}`;
    const projected = project(point.latitude, point.longitude);
    const existing = grouped.get(coordinateKey);

    if (!existing) {
      grouped.set(coordinateKey, {
        ...point,
        ...projected,
        artists: Array.from(new Set(point.artists)).sort(),
        artistCount: new Set(point.artists).size,
      });
      continue;
    }

    const mergedArtists = Array.from(
      new Set([...existing.artists, ...point.artists]),
    ).sort();

    grouped.set(coordinateKey, {
      ...existing,
      sourceLabel:
        existing.sourceLabel.length >= point.sourceLabel.length
          ? existing.sourceLabel
          : point.sourceLabel,
      artists: mergedArtists,
      artistCount: mergedArtists.length,
    });
  }

  return Array.from(grouped.values()).sort(
    (a, b) => b.artistCount - a.artistCount,
  );
}

function pointSize(artistCount: number) {
  return Math.min(68, 18 + Math.sqrt(Math.max(1, artistCount)) * 7.2);
}

function impactLevel(artistCount: number) {
  if (artistCount >= 15) return 'major';
  if (artistCount >= 5) return 'strong';
  if (artistCount >= 2) return 'medium';
  return 'small';
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function constrainCamera(
  camera: Camera,
  viewportWidth: number,
  viewportHeight: number,
): Camera {
  if (viewportWidth <= 0 || viewportHeight <= 0) {
    return camera;
  }

  const zoom = clamp(camera.zoom, MIN_ZOOM, MAX_ZOOM);
  const minX = viewportWidth - viewportWidth * zoom;
  const minY = viewportHeight - viewportHeight * zoom;

  return {
    zoom,
    x: clamp(camera.x, minX, 0),
    y: clamp(camera.y, minY, 0),
  };
}

function cameraForPoint(
  point: NetMapPoint,
  viewportWidth: number,
  viewportHeight: number,
  zoom: number,
): Camera {
  const pointX = (point.mapX / 100) * viewportWidth;
  const pointY = (point.mapY / 100) * viewportHeight;

  return constrainCamera(
    {
      zoom,
      x: viewportWidth / 2 - pointX * zoom,
      y: viewportHeight / 2 - pointY * zoom,
    },
    viewportWidth,
    viewportHeight,
  );
}

function cameraForPoints(
  points: NetMapPoint[],
  viewportWidth: number,
  viewportHeight: number,
): Camera {
  if (points.length === 0) {
    return { x: 0, y: 0, zoom: 1 };
  }

  if (points.length === 1) {
    return cameraForPoint(
      points[0],
      viewportWidth,
      viewportHeight,
      AUTO_FOCUS_ZOOM,
    );
  }

  const xs = points.map((point) => (point.mapX / 100) * viewportWidth);
  const ys = points.map((point) => (point.mapY / 100) * viewportHeight);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const contentWidth = Math.max(80, maxX - minX);
  const contentHeight = Math.max(80, maxY - minY);
  const zoomX = viewportWidth / (contentWidth * 1.44);
  const zoomY = viewportHeight / (contentHeight * 1.44);
  const zoom = clamp(Math.min(zoomX, zoomY), 1.35, 5.2);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return constrainCamera(
    {
      zoom,
      x: viewportWidth / 2 - centerX * zoom,
      y: viewportHeight / 2 - centerY * zoom,
    },
    viewportWidth,
    viewportHeight,
  );
}

export function NetMap({
  activeArtistNames,
  selectedPlaceId,
  onSelectPlace,
  autoFocusKey = '',
}: Props) {
  const viewportRef = useRef<HTMLElement | null>(null);
  const dragRef = useRef<PointerDrag | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const minorEventTimerRef = useRef<number | null>(null);
  const majorEventTimerRef = useRef<number | null>(null);
  const eventEndTimerRef = useRef<number | null>(null);
  const eventSequenceRef = useRef(0);

  const [hoveredPoint, setHoveredPoint] = useState<NetMapPoint | null>(null);
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraAnimating, setIsCameraAnimating] = useState(false);
  const [networkEvent, setNetworkEvent] = useState<NetworkEvent | null>(null);

  const points = useMemo(
    () =>
      mergePoints([
        ...(geographyData as RawPoint[]),
        ...(geographyOverrides as RawPoint[]),
      ]),
    [],
  );

  const activeNames = useMemo(
    () => new Set(activeArtistNames.map(normalize)),
    [activeArtistNames],
  );

  const activePoints = useMemo(
    () =>
      points.filter((point) =>
        point.artists.some((artist) => activeNames.has(normalize(artist))),
      ),
    [activeNames, points],
  );

  const hasActiveSearch = activeNames.size > 0;

  const getViewportSize = useCallback(() => {
    const viewport = viewportRef.current;
    return {
      width: viewport?.clientWidth ?? 0,
      height: viewport?.clientHeight ?? 0,
    };
  }, []);

  const animateCameraTo = useCallback(
    (nextCamera: Camera) => {
      const { width, height } = getViewportSize();
      setIsCameraAnimating(true);
      setCamera(constrainCamera(nextCamera, width, height));

      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
      }

      transitionTimerRef.current = window.setTimeout(() => {
        setIsCameraAnimating(false);
        transitionTimerRef.current = null;
      }, CAMERA_TRANSITION_MS);
    },
    [getViewportSize],
  );

  const resetCamera = useCallback(() => {
    setHoveredPoint(null);
    animateCameraTo({ x: 0, y: 0, zoom: 1 });
  }, [animateCameraTo]);

  const zoomAtViewportPoint = useCallback(
    (nextZoom: number, viewportX: number, viewportY: number) => {
      const { width, height } = getViewportSize();

      setCamera((current) => {
        const zoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
        const worldX = (viewportX - current.x) / current.zoom;
        const worldY = (viewportY - current.y) / current.zoom;

        return constrainCamera(
          {
            zoom,
            x: viewportX - worldX * zoom,
            y: viewportY - worldY * zoom,
          },
          width,
          height,
        );
      });
    },
    [getViewportSize],
  );

  const zoomFromCenter = useCallback(
    (factor: number) => {
      const { width, height } = getViewportSize();
      setHoveredPoint(null);
      zoomAtViewportPoint(camera.zoom * factor, width / 2, height / 2);
    },
    [camera.zoom, getViewportSize, zoomAtViewportPoint],
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || activePoints.length === 0) {
      return;
    }

    setHoveredPoint(null);
    animateCameraTo(
      cameraForPoints(
        activePoints,
        viewport.clientWidth,
        viewport.clientHeight,
      ),
    );
  }, [activePoints, animateCameraTo, autoFocusKey]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const observer = new ResizeObserver(() => {
      setCamera((current) =>
        constrainCamera(
          current,
          viewport.clientWidth,
          viewport.clientHeight,
        ),
      );
    });

    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  const launchNetworkEvent = useCallback(
    (type: NetworkEventType, eventPoints: NetMapPoint[], duration: number) => {
      if (eventPoints.length === 0) return;

      if (eventEndTimerRef.current !== null) {
        window.clearTimeout(eventEndTimerRef.current);
      }

      eventSequenceRef.current += 1;
      setNetworkEvent({
        id: eventSequenceRef.current,
        type,
        pointIds: eventPoints.map((point) => point.id),
        duration,
      });

      eventEndTimerRef.current = window.setTimeout(() => {
        setNetworkEvent(null);
        eventEndTimerRef.current = null;
      }, duration);
    },
    [],
  );

  useEffect(() => {
    let disposed = false;

    const schedule = () => {
      if (disposed) return;

      minorEventTimerRef.current = window.setTimeout(() => {
        if (!document.hidden && points.length > 0 && networkEvent === null) {
          const roll = Math.random();

          if (roll < 0.45) {
            const point = chooseRandom(points);
            if (point) launchNetworkEvent('pulse', [point], 2600);
          } else if (roll < 0.72) {
            const point = chooseRandom(points);
            if (point) launchNetworkEvent('scan', [point], 3400);
          } else if (roll < 0.9) {
            const point = chooseRandom(points);
            if (point) launchNetworkEvent('surge', [point], 2200);
          } else {
            launchNetworkEvent('twin', chooseDistinct(points, 2), 3000);
          }
        }

        schedule();
      }, randomBetween(MINOR_EVENT_MIN_DELAY, MINOR_EVENT_MAX_DELAY));
    };

    schedule();

    return () => {
      disposed = true;
      if (minorEventTimerRef.current !== null) {
        window.clearTimeout(minorEventTimerRef.current);
      }
    };
  }, [launchNetworkEvent, networkEvent, points]);

  useEffect(() => {
    let disposed = false;

    const schedule = () => {
      if (disposed) return;

      majorEventTimerRef.current = window.setTimeout(() => {
        if (!document.hidden && points.length > 0 && networkEvent === null) {
          if (Math.random() < 0.7) {
            launchNetworkEvent(
              'collective',
              chooseDistinct(points, Math.min(6, points.length)),
              4800,
            );
          } else {
            launchNetworkEvent(
              'flash',
              chooseDistinct(points, Math.min(3, points.length)),
              1800,
            );
          }
        }

        schedule();
      }, randomBetween(MAJOR_EVENT_MIN_DELAY, MAJOR_EVENT_MAX_DELAY));
    };

    schedule();

    return () => {
      disposed = true;
      if (majorEventTimerRef.current !== null) {
        window.clearTimeout(majorEventTimerRef.current);
      }
    };
  }, [launchNetworkEvent, networkEvent, points]);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current);
      if (minorEventTimerRef.current !== null) window.clearTimeout(minorEventTimerRef.current);
      if (majorEventTimerRef.current !== null) window.clearTimeout(majorEventTimerRef.current);
      if (eventEndTimerRef.current !== null) window.clearTimeout(eventEndTimerRef.current);
    };
  }, []);

  function handleWheel(event: ReactWheelEvent<HTMLElement>) {
    event.preventDefault();
    const viewport = viewportRef.current;
    if (!viewport) return;

    const rect = viewport.getBoundingClientRect();
    const factor = event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
    setHoveredPoint(null);
    zoomAtViewportPoint(
      camera.zoom * factor,
      event.clientX - rect.left,
      event.clientY - rect.top,
    );
  }

  function handleDoubleClick(event: ReactPointerEvent<HTMLElement>) {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const rect = viewport.getBoundingClientRect();
    setHoveredPoint(null);
    zoomAtViewportPoint(
      camera.zoom * 1.55,
      event.clientX - rect.left,
      event.clientY - rect.top,
    );
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (event.button !== 0) return;

    const target = event.target as HTMLElement;
    if (target.closest('.netImpact') || target.closest('.netMapControls')) {
      return;
    }

    setIsCameraAnimating(false);
    setHoveredPoint(null);
    dragRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startCameraX: camera.x,
      startCameraY: camera.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startClientX;
    const deltaY = event.clientY - drag.startClientY;
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      setIsDragging(true);
    }

    const { width, height } = getViewportSize();
    setCamera(
      constrainCamera(
        {
          zoom: camera.zoom,
          x: drag.startCameraX + deltaX,
          y: drag.startCameraY + deltaY,
        },
        width,
        height,
      ),
    );
  }

  function finishPointerDrag(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    dragRef.current = null;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function getTooltipPosition(point: NetMapPoint) {
    const width = Math.max(1, viewportRef.current?.clientWidth ?? 1);
    const height = Math.max(1, viewportRef.current?.clientHeight ?? 1);
    return {
      left: `${point.mapX * camera.zoom + (camera.x / width) * 100}%`,
      top: `${point.mapY * camera.zoom + (camera.y / height) * 100}%`,
    };
  }

  return (
    <section
      ref={viewportRef}
      className={[
        'netMap',
        isDragging ? 'is-dragging' : '',
        isCameraAnimating ? 'is-camera-animating' : '',
        networkEvent ? `has-network-event has-network-event--${networkEvent.type}` : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Carte documentaire interactive du réseau"
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointerDrag}
      onPointerCancel={finishPointerDrag}
    >
      <div
        className="netMap__camera"
        style={{
          transform: `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.zoom})`,
        }}
      >
        <img
          className="netMap__background"
          src="/assets/net/map/net-map-background.png"
          alt="Carte mondiale du réseau documentaire"
          draggable={false}
        />

        <div className="netMap__surface">
          {points.map((point) => {
            const isActive = point.artists.some((artist) =>
              activeNames.has(normalize(artist)),
            );
            const isSelected = selectedPlaceId === point.id;
            const isEventTarget =
              networkEvent?.pointIds.includes(point.id) ?? false;
            const size = pointSize(point.artistCount);

            return (
              <button
                key={point.id}
                type="button"
                className={[
                  'netImpact',
                  hasActiveSearch && !isActive ? 'is-dimmed' : '',
                  isActive ? 'is-active' : '',
                  isSelected ? 'is-selected' : '',
                  isEventTarget && networkEvent
                    ? `is-event-target is-event-${networkEvent.type}`
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{
                  left: `${point.mapX}%`,
                  top: `${point.mapY}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  ['--net-impact-counter-scale' as string]: String(
                    1 / Math.sqrt(camera.zoom),
                  ),
                }}
                onMouseEnter={() => !isDragging && setHoveredPoint(point)}
                onMouseLeave={() => setHoveredPoint(null)}
                onFocus={() => setHoveredPoint(point)}
                onBlur={() => setHoveredPoint(null)}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectPlace(isSelected ? null : point);

                  const viewport = viewportRef.current;
                  if (viewport && camera.zoom < 2.2) {
                    animateCameraTo(
                      cameraForPoint(
                        point,
                        viewport.clientWidth,
                        viewport.clientHeight,
                        3.4,
                      ),
                    );
                  }
                }}
                aria-label={`${point.sourceLabel}, ${point.artistCount} artiste${
                  point.artistCount > 1 ? 's' : ''
                }`}
              >
                <span
                  className={`netImpactEnergy netImpactEnergy--${impactLevel(
                    point.artistCount,
                  )}`}
                  aria-hidden="true"
                >
                  <span className="netImpactEnergy__halo" />
                  <span className="netImpactEnergy__wave netImpactEnergy__wave--one" />
                  <span className="netImpactEnergy__wave netImpactEnergy__wave--two" />
                  <span className="netImpactEnergy__ring netImpactEnergy__ring--outer" />
                  <span className="netImpactEnergy__ring netImpactEnergy__ring--inner" />
                  <span className="netImpactEnergy__core">
                    <span className="netImpactEnergy__spark" />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="netNetworkLife" aria-hidden="true">
        <span key={`scan-${networkEvent?.id ?? 0}`} className="netNetworkLife__scan" />
        <span key={`flash-${networkEvent?.id ?? 0}`} className="netNetworkLife__flash" />
        <span key={`noise-${networkEvent?.id ?? 0}`} className="netNetworkLife__noise" />
      </div>

      <div className="netMapControls" aria-label="Contrôles de la carte">
        <button
          type="button"
          onClick={() => zoomFromCenter(ZOOM_STEP)}
          disabled={camera.zoom >= MAX_ZOOM - 0.01}
          aria-label="Agrandir la carte"
          title="Zoom avant"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => zoomFromCenter(1 / ZOOM_STEP)}
          disabled={camera.zoom <= MIN_ZOOM + 0.01}
          aria-label="Réduire la carte"
          title="Zoom arrière"
        >
          −
        </button>
        <button
          type="button"
          className="netMapControls__reset"
          onClick={resetCamera}
          aria-label="Réinitialiser la carte"
          title="Réinitialiser"
        >
          ◎
        </button>
        <span className="netMapControls__zoom">{camera.zoom.toFixed(1)}×</span>
      </div>

      <div className="netMapHint" aria-hidden="true">
        Molette : zoom · Cliquer-glisser : déplacer · Double-clic : rapprocher
      </div>

      {hoveredPoint ? (
        <aside className="netMapTooltip" style={getTooltipPosition(hoveredPoint)}>
          <p className="netMapTooltip__place">{hoveredPoint.sourceLabel}</p>
          <p className="netMapTooltip__count">
            {hoveredPoint.artistCount} artiste
            {hoveredPoint.artistCount > 1 ? 's' : ''}
          </p>
          <p className="netMapTooltip__artists">
            {hoveredPoint.artists.slice(0, 5).join(' · ')}
            {hoveredPoint.artists.length > 5 ? '…' : ''}
          </p>
        </aside>
      ) : null}
    </section>
  );
}
