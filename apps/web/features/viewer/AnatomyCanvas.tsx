import { ContactShadows, Line, OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import type { LayerId, RegistryBundle, Vector3 } from '@momso/schema'
import { getCameraView } from '@momso/schema'
import { getFocusPointForEntity, sampleProxyScene } from '@momso/runtime'
import { useMemo, useRef } from 'react'
import { Quaternion, Vector3 as ThreeVector3 } from 'three'

type Point3 = [number, number, number]

interface AnatomyCanvasProps {
  frame: number
  cameraViewId: string
  registry: RegistryBundle
  layerVisibility: Record<LayerId, boolean>
  selectedEntityId: string | null
  focusedEntityIds: string[]
  onSelectEntity: (entityId: string | null) => void
}

function toPoint3(vector: Vector3): Point3 {
  return [vector.x, vector.y, vector.z]
}

function segmentTransform(start: Point3, end: Point3) {
  const startVector = new ThreeVector3(...start)
  const endVector = new ThreeVector3(...end)
  const direction = endVector.clone().sub(startVector)
  const midpoint = startVector.clone().add(endVector).multiplyScalar(0.5)
  const quaternion = new Quaternion().setFromUnitVectors(
    new ThreeVector3(0, 1, 0),
    direction.clone().normalize(),
  )

  return {
    position: midpoint,
    quaternion,
    bodyLength: Math.max(direction.length() - 0.16, 0.001),
  }
}

function SegmentCapsule({
  start,
  end,
  radius,
  color,
  opacity = 1,
  highlight = false,
}: {
  start: Point3
  end: Point3
  radius: number
  color: string
  opacity?: number
  highlight?: boolean
}) {
  const { position, quaternion, bodyLength } = segmentTransform(start, end)

  return (
    <mesh position={position.toArray()} quaternion={quaternion}>
      <capsuleGeometry args={[radius, bodyLength, 10, 18]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={highlight ? 0.52 : 0.1}
        opacity={opacity}
        transparent={opacity < 1}
      />
    </mesh>
  )
}

function Marker({
  point,
  color,
  selected = false,
  onClick,
  interactive = true,
}: {
  point: Point3
  color: string
  selected?: boolean
  interactive?: boolean
  onClick?: () => void
}) {
  return (
    <group position={point}>
      <mesh
        onClick={(event) => {
          event.stopPropagation()
          onClick?.()
        }}
      >
        <sphereGeometry args={[selected ? 0.08 : 0.055, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 0.48 : 0.08}
          transparent
          opacity={interactive ? 0.92 : 0.45}
        />
      </mesh>
      {selected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.14, 0.01, 10, 24]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  )
}

function CameraRig({
  cameraViewId,
  focusPoint,
}: {
  cameraViewId: string
  focusPoint: Point3 | null
}) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const { camera } = useThree()
  const cameraView = useMemo(() => getCameraView(cameraViewId), [cameraViewId])
  const desiredTarget = useRef(
    new ThreeVector3(
      cameraView?.target.x ?? 0,
      cameraView?.target.y ?? -0.6,
      cameraView?.target.z ?? 0,
    ),
  )

  useFrame(() => {
    if (!cameraView) {
      return
    }

    const baseTarget = new ThreeVector3(
      focusPoint?.[0] ?? cameraView.target.x,
      focusPoint?.[1] ?? cameraView.target.y,
      focusPoint?.[2] ?? cameraView.target.z,
    )
    desiredTarget.current.lerp(baseTarget, 0.12)

    const desiredPosition = new ThreeVector3(
      cameraView.position.x,
      cameraView.position.y,
      cameraView.position.z,
    )

    if (focusPoint) {
      desiredPosition.add(
        new ThreeVector3(focusPoint[0], focusPoint[1], focusPoint[2]).sub(
          new ThreeVector3(cameraView.target.x, cameraView.target.y, cameraView.target.z),
        ),
      )
    }

    camera.position.lerp(desiredPosition, 0.08)

    if (controlsRef.current) {
      controlsRef.current.target.lerp(desiredTarget.current, 0.12)
      controlsRef.current.update()
    } else {
      camera.lookAt(desiredTarget.current)
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={false}
      minDistance={1.5}
      maxDistance={4.4}
    />
  )
}

function Scene({
  frame,
  cameraViewId,
  registry,
  layerVisibility,
  selectedEntityId,
  focusedEntityIds,
  onSelectEntity,
}: AnatomyCanvasProps) {
  const sample = useMemo(() => sampleProxyScene(frame), [frame])
  const activeFocusId = selectedEntityId ?? focusedEntityIds[0] ?? null
  const focusPoint = activeFocusId
    ? getFocusPointForEntity(activeFocusId, frame, registry)
    : null

  const entityPositions = useMemo(
    () =>
      registry.entities.map((entity) => ({
        entity,
        point:
          sample.anchorPositions[entity.anchorId] ??
          registry.anchors.find((anchor) => anchor.id === entity.anchorId)?.position ??
          { x: 0, y: 0, z: 0 },
      })),
    [registry.anchors, registry.entities, sample.anchorPositions],
  )

  return (
    <>
      <color attach="background" args={['#F7F7F7']} />
      <fog attach="fog" args={['#F7F7F7', 4.5, 8]} />
      <hemisphereLight intensity={0.8} color="#FFFFFF" groundColor="#D7D4CF" />
      <directionalLight position={[3.8, 4.4, 4.2]} intensity={1.3} />
      <directionalLight position={[-3.2, 2.8, -2]} intensity={0.35} color="#D9E0EA" />

      <group position={[0, -0.35, 0]}>
        {layerVisibility.skeleton && (
          <group>
            {sample.skeletonSegments.map((segment) => (
              <SegmentCapsule
                key={segment.id}
                start={toPoint3(segment.start)}
                end={toPoint3(segment.end)}
                radius={segment.radius}
                color={segment.color}
                highlight={selectedEntityId === 'skeleton.pelvis' || selectedEntityId === 'skeleton.femur.R'}
              />
            ))}
          </group>
        )}

        {layerVisibility.muscle && (
          <group>
            {sample.muscleSegments.map((segment) => (
              <SegmentCapsule
                key={segment.id}
                start={toPoint3(segment.start)}
                end={toPoint3(segment.end)}
                radius={segment.radius}
                color={segment.color}
                opacity={segment.opacity}
                highlight={
                  selectedEntityId === 'muscle.gluteus_maximus.R' ||
                  selectedEntityId === 'muscle.biceps_femoris_long_head.R'
                }
              />
            ))}
          </group>
        )}

        {layerVisibility.ligament && (
          <Line
            points={sample.polylines.ligament.map(toPoint3)}
            color="#F59E0B"
            lineWidth={3.2}
            transparent
            opacity={selectedEntityId === 'ligament.patellar.R' ? 1 : 0.85}
          />
        )}

        {layerVisibility.nerve && (
          <Line
            points={sample.polylines.nerve.map(toPoint3)}
            color="#F2D14C"
            lineWidth={2.2}
            transparent
            opacity={selectedEntityId === 'nerve.sciatic.R' ? 1 : 0.92}
          />
        )}

        {layerVisibility.meridian && (
          <Line
            points={sample.polylines.meridian.map(toPoint3)}
            color="#2DD4E0"
            lineWidth={1.8}
            transparent
            opacity={selectedEntityId === 'meridian.stomach.R' ? 1 : 0.96}
          />
        )}

        {layerVisibility.acupoint && (
          <group>
            {sample.markers.acupoint.map((point, index) => (
              <Marker
                key={`acupoint-${index}`}
                point={toPoint3(point)}
                color="#35A7FF"
                selected={selectedEntityId === 'acupoint.ST32.R'}
                interactive={false}
              />
            ))}
          </group>
        )}

        {layerVisibility.myofascial_line && (
          <Line
            points={sample.polylines.myofascial_line.map(toPoint3)}
            color="#9FE870"
            lineWidth={2}
            transparent
            opacity={selectedEntityId === 'myofascial_line.superficial_back.R' ? 1 : 0.95}
          />
        )}

        {entityPositions.map(({ entity, point }) => {
          const isVisible = layerVisibility[entity.layerId] || selectedEntityId === entity.id
          if (!isVisible) {
            return null
          }

          const isSelected =
            selectedEntityId === entity.id || focusedEntityIds.includes(entity.id)

          return (
            <Marker
              key={entity.id}
              point={toPoint3(point)}
              color={entity.displayColor}
              selected={isSelected}
              onClick={() => onSelectEntity(entity.id)}
            />
          )
        })}
      </group>

      <ContactShadows
        position={[0, -1.74, 0]}
        opacity={0.14}
        scale={5}
        blur={2.4}
        far={3.5}
      />

      <CameraRig cameraViewId={cameraViewId} focusPoint={focusPoint ? toPoint3(focusPoint) : null} />
    </>
  )
}

export function AnatomyCanvas(props: AnatomyCanvasProps) {
  return (
    <Canvas
      camera={{ position: [2.6, 1.45, 2.7], fov: 30 }}
      onPointerMissed={() => props.onSelectEntity(null)}
    >
      <Scene {...props} />
    </Canvas>
  )
}
