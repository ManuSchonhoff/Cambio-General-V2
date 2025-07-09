export const isEntradaReal = (operation) => {
  const tipos = [
    "venta_divisa_ars",
    "prestamo_recibido",
    "aporte_capital",
    "inversion_retorno",
    "dividendos_recibidos",
    "cobro_deuda",
    "comision_ganada",
    "otro_ingreso",
  ];
  return tipos.includes(operation.type);
};

export const isSalidaReal = (operation) => {
  const tipos = [
    "compra_divisa_ars",
    "prestamo_otorgado",
    "retiro_capital",
    "inversion_realizada",
    "dividendos_pagados",
    "pago_deuda",
    "comision_pagada",
    "otro_egreso",
  ];
  return tipos.includes(operation.type);
};
