import React from 'react';

export function TeamRadar({ stats }) {
    // Stats vienen 0-100
    // Mapeamos a coordenadas de polígono
    const size = 100;
    const center = size / 2;
    const radius = 40; // Radio del gráfico

    // Ejes: 
    // 0: Attack (Arriba)
    // 1: Magic (Derecha Arriba)
    // 2: Defense (Derecha Abajo)
    // 3: CC (Abajo)
    // 4: Mobility (Izquierda) - Pentagono

    // Mejor usaremos 5 ejes (Pentágono)
    const axes = [
        { label: "Daño Físico", value: stats.attack, angle: -90 },
        { label: "Magia", value: stats.magic, angle: -18 },
        { label: "Tanque", value: stats.defense, angle: 54 },
        { label: "Control (CC)", value: stats.cc, angle: 126 },
        { label: "Movilidad", value: stats.mobility, angle: 198 },
    ];

    const getPoint = (value, angle) => {
        const r = (value / 100) * radius;
        const x = center + r * Math.cos(angle * Math.PI / 180);
        const y = center + r * Math.sin(angle * Math.PI / 180);
        return `${x},${y}`;
    };

    const polyPoints = axes.map(a => getPoint(a.value, a.angle)).join(" ");
    const fullPoints = axes.map(a => getPoint(100, a.angle)).join(" "); // Fondo

    return (
        <div className="flex flex-col items-center">
            <svg width={size * 1.5} height={size * 1.5} viewBox={`0 0 ${size} ${size}`}>
                {/* Fondo Pentágono */}
                <polygon points={fullPoints} fill="#1f2937" stroke="#374151" strokeWidth="1" />

                {/* Ejes */}
                {axes.map((a, i) => {
                    const p = getPoint(100, a.angle);
                    return <line key={i} x1={center} y1={center} x2={p.split(',')[0]} y2={p.split(',')[1]} stroke="#374151" strokeWidth="0.5" />;
                })}

                {/* Datos */}
                <polygon points={polyPoints} fill="rgba(168, 85, 247, 0.5)" stroke="#a855f7" strokeWidth="2" />

                {/* Etiquetas */}
                {axes.map((a, i) => {
                    const p = getPoint(115, a.angle); // Un poco más afuera
                    return (
                        <text
                            key={i}
                            x={p.split(',')[0]}
                            y={p.split(',')[1]}
                            fontSize="4"
                            fill="#9ca3af"
                            textAnchor="middle"
                            alignmentBaseline="middle"
                        >
                            {a.label}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
}
