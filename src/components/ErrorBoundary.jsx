import React from 'react';

// Crear la clase ErrorBoundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Actualiza el estado para mostrar la UI de fallback
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Puedes registrar el error en un servicio externo aquí
    console.error("Error capturado por ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Algo salió mal. Por favor, recarga la página.</h1>;
    }

    return this.props.children;
  }
}

// Exportar ErrorBoundary como default
export default ErrorBoundary;