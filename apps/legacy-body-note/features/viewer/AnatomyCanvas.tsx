import { ContactShadows, Line, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Quaternion, Vector3 } from 'three'
import { useWorkspaceStore } from '../../stores/useWorkspaceStore'

type Point3 = [number, number, number]

function pointFrom(origin: Point3, length: number, angle: number): Point3 {
  return [
    origin[0] + Math.sin(angle) * length,
    origin[1] - Math.cos(angle) * length,
    origin[2],
  ]
}

function segmentTransform(start: Point3, end: Point3) {
  const startVector = new Vector3(...start)
  const endVector = new Vector3(...end)
  const direction = endVector.clone().sub(startVector)
  const midpoint = startVector.clone().add(endVector).multiplyScalar(0.5)
  const quaternion = new Quaternion().setFromUnitVectors(
    new Vector3(0, 1, 0),
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
  emissive,
}: {
  start: Point3
  end: Point3
  radius: number
  color: string
  opacity?: number
  emissive?: string
}) {
  const { position, quaternion, bodyLength } = segmentTransform(start, end)

  return (
    <mesh position={position.toArray()} quaternion={quaternion}>
      <capsuleGeometry args={[radius, bodyLength, 10, 18]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive ?? color}
        emissiveIntensity={emissive ? 0.45 : 0.08}
        opacity={opacity}
        transparent={opacity < 1}
      />
    </mesh>
  )
}

function JointMarker({
  point,
  color,
  scale = 1,
}: {
  point: Point3
  color: string
  scale?: number
}) {
  return (
    <mesh position={point}>
      <sphereGeometry args={[0.055 * scale, 16, 16]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

function AnatomyRig() {
  const resolvedFrame = useWorkspaceStore((state) => state.resolvedFrame)
  const layerVisibility = useWorkspaceStore((state) => state.layerVisibility)

  const scrubProgress =
    resolvedFrame <= 55 ? resolvedFrame / 55 : 1 - (resolvedFrame - 55) / 45
  const poseStrength = Math.max(0, Math.min(1, scrubProgress))
  const hipAngle = poseStrength * 0.62
  const kneeAngle = poseStrength * 1.2

  const pelvis: Point3 = [0.05, 0.35, 0]
  const chest: Point3 = [0.12, 1.28 - poseStrength * 0.04, 0]
  const neck: Point3 = [0.18, 1.72 - poseStrength * 0.06, 0]
  const shoulder: Point3 = [0.26, 1.44 - poseStrength * 0.05, 0]
  const hip: Point3 = [0.08, 0.18, 0]
  const knee = pointFrom(hip, 0.95, hipAngle)
  const ankle = pointFrom(knee, 0.94, hipAngle - kneeAngle)
  const toe: Point3 = [ankle[0] + 0.32, ankle[1] - 0.03, 0.06]

  const ligamentPoints: Point3[] = [
    [knee[0] - 0.12, knee[1] + 0.12, 0.08],
    [knee[0] - 0.01, knee[1] + 0.02, 0.08],
    [knee[0] + 0.12, knee[1] - 0.18, 0.08],
  ]

  const nervePoints: Point3[] = [
    [pelvis[0] - 0.08, pelvis[1] + 0.14, -0.04],
    [hip[0] - 0.16, hip[1] - 0.16, -0.04],
    [knee[0] - 0.1, knee[1] + 0.08, -0.03],
    [ankle[0] - 0.08, ankle[1] + 0.16, -0.01],
  ]

  const meridianPoints: Point3[] = [
    [chest[0] + 0.16, chest[1] - 0.22, 0.14],
    [hip[0] + 0.18, hip[1] - 0.04, 0.16],
    [knee[0] + 0.12, knee[1] - 0.1, 0.16],
    [ankle[0] + 0.05, ankle[1] + 0.02, 0.12],
  ]

  const myofascialPoints: Point3[] = [
    [shoulder[0] - 0.18, shoulder[1] + 0.12, 0.12],
    [pelvis[0] + 0.06, pelvis[1] + 0.06, 0.12],
    [knee[0] + 0.18, knee[1] - 0.12, 0.12],
    [toe[0] - 0.06, toe[1] + 0.02, 0.12],
  ]

  return (
    <group position={[0, -0.35, 0]}>
      {layerVisibility.skeleton && (
        <group>
          <SegmentCapsule start={pelvis} end={chest} radius={0.1} color="#A8A29E" />
          <SegmentCapsule start={chest} end={neck} radius={0.07} color="#A8A29E" />
          <SegmentCapsule start={hip} end={knee} radius={0.06} color="#8F8A83" />
          <SegmentCapsule start={knee} end={ankle} radius={0.055} color="#8F8A83" />
          <SegmentCapsule start={ankle} end={toe} radius={0.035} color="#8F8A83" />
          <JointMarker point={pelvis} color="#8F8A83" />
          <JointMarker point={hip} color="#8F8A83" />
          <JointMarker point={knee} color="#8F8A83" />
          <JointMarker point={ankle} color="#8F8A83" scale={0.9} />
        </group>
      )}

      {layerVisibility.muscle && (
        <group>
          <SegmentCapsule
            start={[pelvis[0] - 0.05, pelvis[1] + 0.02, 0.05]}
            end={[chest[0] - 0.02, chest[1] - 0.08, 0.05]}
            radius={0.16}
            color="#FF8A80"
            opacity={0.54}
          />
          <SegmentCapsule
            start={[hip[0] + 0.04, hip[1] - 0.02, 0.06]}
            end={[knee[0] + 0.02, knee[1] + 0.08, 0.06]}
            radius={0.12}
            color="#FF5C57"
            opacity={0.56}
          />
          <SegmentCapsule
            start={[knee[0] + 0.02, knee[1] - 0.04, 0.06]}
            end={[ankle[0] + 0.02, ankle[1] + 0.16, 0.06]}
            radius={0.09}
            color="#FF6A5F"
            opacity={0.48}
          />
        </group>
      )}

      {layerVisibility.ligament && (
        <Line
          points={ligamentPoints}
          color="#F59E0B"
          lineWidth={2.4 + poseStrength * 1.4}
          transparent
          opacity={0.85}
        />
      )}

      {layerVisibility.nerve && (
        <Line
          points={nervePoints}
          color="#F2D14C"
          lineWidth={1.8 + poseStrength}
          transparent
          opacity={0.92}
        />
      )}

      {layerVisibility.meridian && (
        <Line
          points={meridianPoints}
          color="#2DD4E0"
          lineWidth={1.6}
          transparent
          opacity={0.96}
        />
      )}

      {layerVisibility.acupoint && (
        <group>
          <JointMarker point={meridianPoints[1]} color="#35A7FF" scale={0.72} />
          <JointMarker point={meridianPoints[2]} color="#35A7FF" scale={0.72} />
        </group>
      )}

      {layerVisibility.myofascial_line && (
        <Line
          points={myofascialPoints}
          color="#9FE870"
          lineWidth={1.7}
          transparent
          opacity={0.95}
        />
      )}
    </group>
  )
}

export function AnatomyCanvas() {
  return (
    <Canvas camera={{ position: [2.6, 1.45, 2.7], fov: 30 }}>
      <color attach="background" args={['#F7F7F7']} />
      <fog attach="fog" args={['#F7F7F7', 4.5, 8]} />
      <hemisphereLight intensity={0.8} color="#FFFFFF" groundColor="#D7D4CF" />
      <directionalLight position={[3.8, 4.4, 4.2]} intensity={1.3} />
      <directionalLight position={[-3.2, 2.8, -2]} intensity={0.35} color="#D9E0EA" />

      <AnatomyRig />

      <ContactShadows
        position={[0, -1.74, 0]}
        opacity={0.14}
        scale={5}
        blur={2.4}
        far={3.5}
      />

      <OrbitControls enablePan={false} minDistance={2.4} maxDistance={4.4} />
    </Canvas>
  )
}
