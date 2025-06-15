// App com IA e visual divertido, escuro e elegante sem Tailwind (estilos inline)
import { useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';

const carregarModelo = async () => {
  return await tf.loadLayersModel('/model/model.json');
};

export default function IAderivApp() {
  const [resultado, setResultado] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [modeloIA, setModeloIA] = useState(null);

  useEffect(() => {
    carregarModelo().then(setModeloIA);
  }, []);

  const analisarMercado = async () => {
    if (!modeloIA) return;
    setCarregando(true);
    setResultado(null);

    const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          ticks_history: 'R_75',
          style: 'candles',
          granularity: 300,
          count: 10
        })
      );
    };

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.candles) {
        const entrada = gerarFeatures(data.candles);
        const inputTensor = tf.tensor2d([entrada]);
        const previsao = modeloIA.predict(inputTensor);

        previsao.array().then((val) => {
          const [probAlta, probBaixa] = val[0];
          const resultado = probAlta > 0.6
            ? '📈 Alta'
            : probBaixa > 0.6
            ? '📉 Baixa'
            : '🤔 Indefinido';
          setResultado(resultado);
          setCarregando(false);
        });
        ws.close();
      }
    };
  };

  const gerarFeatures = (candles) => {
    const c = candles[candles.length - 1];
    return [
      c.open,
      c.high,
      c.low,
      c.close,
      c.close - c.open,
      c.high - c.low,
      c.high - Math.max(c.open, c.close),
      Math.min(c.open, c.close) - c.low
    ];
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #111827, #1f2937, #000)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>🤖 IA Deriv App</h1>
      <p style={{ fontSize: '1.1rem', maxWidth: '600px', marginBottom: '2rem' }}>
        Clique no botão abaixo e a inteligência artificial vai analisar os candles de 5 minutos do Volatility 75 e indicar uma entrada:
      </p>

      <button
        onClick={analisarMercado}
        disabled={carregando || !modeloIA}
        style={{
          backgroundColor: '#7c3aed',
          color: 'white',
          fontSize: '1.2rem',
          padding: '1rem 2rem',
          borderRadius: '2rem',
          border: 'none',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          marginBottom: '2rem',
          cursor: 'pointer',
          transition: 'transform 0.2s ease-in-out',
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        {carregando ? '🔍 Analisando mercado...' : '🚀 Analisar Agora'}
      </button>

      {resultado && (
        <div style={{
          fontSize: '1.8rem',
          fontWeight: 'bold',
          backgroundColor: '#1f2937',
          padding: '1rem 2rem',
          borderRadius: '1rem',
          boxShadow: 'inset 0 0 10px #00000099'
        }}>
          🔮 Tendência: {resultado}
        </div>
      )}

      <footer style={{ fontSize: '0.9rem', color: '#9ca3af', marginTop: '3rem' }}>
        Desenvolvido para iniciantes — versão beta 🧪
      </footer>
    </div>
  );
}
