# Power Rangers: Deck-Building Game — Contador de Vida y Energía

App web para llevar la **vida** y la **energía** de dos jugadores en *Power Rangers: Deck-Building Game*.
Pensada para el teléfono apoyado en la mesa entre los dos jugadores: el panel de arriba está **girado 180°** para que cada uno lea su marcador de frente (estilo *lifetap*).

🎮 **Jugar:** https://gitntn.github.io/power-rangers-life-energy/

---

## Cómo funciona

- **Vida:** empieza en **30**, máximo **30**, mínimo **0**.
- **Energía:** empieza en **0**, máximo **20**, mínimo **0**.
- Botones **+ / −** para vida y energía de cada jugador. Mantené presionado para sumar/restar rápido.
- Cuando la vida de un jugador llega a **0**, **pierde** y se anuncia al **ganador**.
- **Reiniciar** vuelve a 30 de vida y 0 de energía para ambos.
- Cada jugador puede tocar su nombre para **cambiar el nombre y el color de Ranger**.
- El estado se guarda solo (localStorage): si cerrás y volvés, sigue donde estaba.
- **Bilingüe** Español / English (selector al inicio y botón 🌐 para cambiar).
- Instalable como app (PWA) y funciona sin conexión.

## Tecnología

HTML + CSS + JavaScript, sin dependencias. Se publica con GitHub Pages.

## Desarrollo local

Abrí `index.html` en el navegador, o serví la carpeta:

```bash
python -m http.server 8000
```

Luego entrá a `http://localhost:8000`.
