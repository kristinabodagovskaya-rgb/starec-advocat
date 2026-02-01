import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useRef, useState } from 'react'
import * as THREE from 'three'

function Character({ position, color, onClick }: {
  position: [number, number, number]
  color: string
  onClick: () => void
}) {
  const ref = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
      ref.current.position.y = hovered ? position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.1 : position[1]
    }
  })

  return (
    <group
      ref={ref}
      position={position}
      onClick={onClick}
      onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default' }}
      scale={hovered ? 1.15 : 1}
    >
      <mesh position={[0, 0.5, 0]}>
        <capsuleGeometry args={[0.3, 0.6, 8, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.3, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#ffcc99" />
      </mesh>
      <mesh position={[-0.08, 1.35, 0.2]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#000" />
      </mesh>
      <mesh position={[0.08, 1.35, 0.2]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#000" />
      </mesh>
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.5, 0.6, 0.2, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}

function CourtScene({ onSelectRole }: { onSelectRole: (role: string) => void }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#ffd700" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#4a3a2a" />
      </mesh>

      <mesh position={[0, 3, -5]}>
        <boxGeometry args={[12, 6, 0.3]} />
        <meshStandardMaterial color="#2a1a0a" />
      </mesh>

      <mesh position={[0, 0.5, -3]}>
        <boxGeometry args={[4, 1, 1]} />
        <meshStandardMaterial color="#5a3a1a" />
      </mesh>

      <Character position={[-2.5, 0, 1]} color="#8B0000" onClick={() => onSelectRole('prosecution')} />
      <Character position={[0, 0, 1]} color="#000080" onClick={() => onSelectRole('defense')} />
      <Character position={[2.5, 0, 1]} color="#806000" onClick={() => onSelectRole('court')} />

      <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 2.5} />
    </>
  )
}

export default function Scene3D({ onSelectRole }: { onSelectRole: (role: string) => void }) {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 3, 6], fov: 50 }}>
        <color attach="background" args={['#1a1510']} />
        <CourtScene onSelectRole={onSelectRole} />
      </Canvas>

      <div style={{ position: 'absolute', top: 32, left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ffd700', textShadow: '0 0 20px rgba(255,215,0,0.5)', fontFamily: 'Georgia, serif' }}>
          Выберите свою роль
        </h1>
        <p style={{ color: '#9ca3af' }}>Кликните на персонажа</p>
      </div>

      <div style={{ position: 'absolute', bottom: 32, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 32, pointerEvents: 'none' }}>
        {[
          { label: 'ПРОКУРОР', color: '#ff6b6b' },
          { label: 'АДВОКАТ', color: '#6b9fff' },
          { label: 'СУДЬЯ', color: '#ffd700' },
        ].map((item) => (
          <div key={item.label} style={{ padding: '12px 24px', borderRadius: 12, background: 'rgba(0,0,0,0.7)', border: `2px solid ${item.color}`, color: item.color, fontWeight: 'bold' }}>
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}
