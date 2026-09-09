import * as XLSX from "xlsx";
import { Workbook } from "exceljs";

export const exportAnalysisToExcel = async (tableData, fileName = "Análisis_Votación") => {
  if (!tableData || tableData.length === 0) {
    alert("No hay datos para exportar");
    return;
  }

  // Simular tiempo de procesamiento para mostrar animación
  await new Promise(resolve => setTimeout(resolve, 800));

  // Crear workbook con exceljs para estilos avanzados
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet("Análisis de Votación");

  // Definir columnas
  worksheet.columns = [
    { header: "Departamento", key: "Departamento", width: 18 },
    { header: "Municipio", key: "Municipio", width: 18 },
    { header: "Puesto de Votación", key: "PuestoVotacion", width: 25 },
    { header: "Total Puesto", key: "TotalPuesto", width: 14 },
    { header: "Mesa", key: "Mesa", width: 8 },
    { header: "Registrado", key: "Registrado", width: 14 },
    { header: "Votado", key: "Votado", width: 14 },
    { header: "DIVIPOLE", key: "DIVIPOLE", width: 14 },
    { header: "% Reg/DIV", key: "PorRegDiv", width: 14 },
    { header: "% Vot/DIV", key: "PorVotDiv", width: 14 },
    { header: "% Reg/Vot", key: "PorRegVot", width: 14 },
  ];

  // Estilos para headers
  const headerFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0066B2" },
  };

  const headerFont = {
    bold: true,
    color: { argb: "FFFFFFFF" },
    size: 11,
  };

  const headerAlignment = {
    horizontal: "center",
    vertical: "center",
    wrapText: true,
  };

  const headerBorder = {
    left: { style: "thin", color: { argb: "FF000000" } },
    right: { style: "thin", color: { argb: "FF000000" } },
    top: { style: "thin", color: { argb: "FF000000" } },
    bottom: { style: "medium", color: { argb: "FF000000" } },
  };

  // Aplicar estilos al header
  worksheet.getRow(1).height = 28;
  worksheet.getRow(1).eachCell((cell) => {
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = headerAlignment;
    cell.border = headerBorder;
  });

  // Estilos para datos
  const dataBorder = {
    left: { style: "thin", color: { argb: "FFD3D3D3" } },
    right: { style: "thin", color: { argb: "FFD3D3D3" } },
    top: { style: "thin", color: { argb: "FFD3D3D3" } },
    bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
  };

  const dataAlignment = {
    horizontal: "center",
    vertical: "center",
    wrapText: true,
  };

  const dataFont = {
    size: 10,
    color: { argb: "FF000000" },
  };

  const lightGrayFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF5F5F5" },
  };

  const whiteFont = {
    bold: true,
    size: 10,
    color: { argb: "FFFFFFFF" },
  };

  // Colores para los badges de porcentajes
  const greenFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFC6EFCE" }, // Verde claro
  };

  const amberFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFEB9C" }, // Ámbar claro
  };

  const blueFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFBDD7EE" }, // Azul claro
  };

  const greenFont = {
    bold: true,
    size: 10,
    color: { argb: "FF00B050" }, // Verde oscuro
  };

  const amberFont = {
    bold: true,
    size: 10,
    color: { argb: "FFF79646" }, // Ámbar oscuro
  };

  const blueFont = {
    bold: true,
    size: 10,
    color: { argb: "FF0070C0" }, // Azul oscuro
  };

  let rowIndex = 2;

  // Agregar datos de puestos y mesas
  tableData.forEach((puesto, puestoIdx) => {
    // Fila del puesto (summary)
    const puestoRow = worksheet.getRow(rowIndex);
    puestoRow.values = {
      Departamento: puesto.departamento,
      Municipio: puesto.municipio,
      PuestoVotacion: `${puesto.puestoVotacion} (Total)`,
      TotalPuesto: puesto.totalPuesto,
      Mesa: "-",
      Registrado: puesto.totalRegistradoGeneral,
      Votado: puesto.totalVotadoGeneral,
      DIVIPOLE: puesto.totalDivpolGeneral,
      PorRegDiv: `${puesto.porcentajeRegistradoVsDivGeneral}%`,
      PorVotDiv: `${puesto.porcentajeVotadoVsDivGeneral}%`,
      PorRegVot: `${puesto.porcentajeGeneral}%`,
    };

    puestoRow.height = 24;
    puestoRow.eachCell((cell, colNumber) => {
      cell.fill = lightGrayFill;
      cell.font = { bold: true, size: 10, color: { argb: "FF000000" } };
      cell.alignment = dataAlignment;
      cell.border = dataBorder;

      // Aplicar colores a los porcentajes en fila summary
      if (colNumber === 9) { // % Reg/DIV
        cell.fill = greenFill;
        cell.font = greenFont;
      } else if (colNumber === 10) { // % Vot/DIV
        cell.fill = amberFill;
        cell.font = amberFont;
      } else if (colNumber === 11) { // % Reg/Vot
        cell.fill = blueFill;
        cell.font = blueFont;
      }
    });

    rowIndex++;

    // Filas de mesas
    if (puesto.mesas && puesto.mesas.length > 0) {
      puesto.mesas.forEach((mesa, mesaIdx) => {
        const mesaRow = worksheet.getRow(rowIndex);
        mesaRow.values = {
          Departamento: "",
          Municipio: "",
          PuestoVotacion: "",
          TotalPuesto: "",
          Mesa: mesa.mesa,
          Registrado: mesa.totalRegistrado,
          Votado: mesa.totalVotado,
          DIVIPOLE: mesa.totalDivipol,
          PorRegDiv: `${mesa.porcentajeRegistradoVsDivipol}%`,
          PorVotDiv: `${mesa.porcentajeVotadoVsDivipol}%`,
          PorRegVot: mesa.porcentajeRegistradoVsVotado,
        };

        mesaRow.height = 20;
        mesaRow.eachCell((cell, colNumber) => {
          cell.border = dataBorder;
          cell.alignment = dataAlignment;
          cell.font = dataFont;

          // Alternar colores de fila
          if (mesaIdx % 2 === 0) {
            cell.fill = whiteFont.color ? { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } } : null;
          } else {
            cell.fill = lightGrayFill;
          }

          // Aplicar colores a los porcentajes
          if (colNumber === 9) { // % Reg/DIV
            cell.fill = greenFill;
            cell.font = greenFont;
          } else if (colNumber === 10) { // % Vot/DIV
            cell.fill = amberFill;
            cell.font = amberFont;
          } else if (colNumber === 11) { // % Reg/Vot
            cell.fill = blueFill;
            cell.font = blueFont;
          }
        });

        rowIndex++;
      });
    }

    // Fila vacía entre puestos
    rowIndex++;
  });

  // Generar nombre de archivo con fecha
  const timestamp = new Date().toISOString().split("T")[0];
  const fullFileName = `${fileName}_${timestamp}.xlsx`;

  // Generar buffer y descargar
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fullFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const exportTrackingToExcel = async (voters, filterType = "expected", fileName = "Seguimiento_Votantes") => {
  if (!voters || voters.length === 0) {
    alert("No hay datos para exportar");
    return;
  }

  // Simular tiempo de procesamiento para mostrar animación
  await new Promise(resolve => setTimeout(resolve, 800));

  // Crear workbook con exceljs para estilos avanzados
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet("Seguimiento de Votantes");

  // Definir columnas
  worksheet.columns = [
    { header: "Identificación", key: "Identificacion", width: 18 },
    { header: "Nombre", key: "Nombre", width: 20 },
    { header: "Apellido", key: "Apellido", width: 20 },
    { header: "Género", key: "Genero", width: 12 },
    { header: "Teléfono", key: "Telefono", width: 16 },
    { header: "Email", key: "Email", width: 26 },
    { header: "Departamento", key: "Departamento", width: 18 },
    { header: "Municipio", key: "Municipio", width: 18 },
    { header: "Centro de Votación", key: "CentroVotacion", width: 25 },
    { header: "Mesa", key: "Mesa", width: 10 },
  ];

  // Estilos para headers
  const headerFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0066B2" },
  };

  const headerFont = {
    bold: true,
    color: { argb: "FFFFFFFF" },
    size: 11,
  };

  const headerAlignment = {
    horizontal: "center",
    vertical: "center",
    wrapText: true,
  };

  const headerBorder = {
    left: { style: "thin", color: { argb: "FF000000" } },
    right: { style: "thin", color: { argb: "FF000000" } },
    top: { style: "thin", color: { argb: "FF000000" } },
    bottom: { style: "medium", color: { argb: "FF000000" } },
  };

  // Aplicar estilos al header
  worksheet.getRow(1).height = 28;
  worksheet.getRow(1).eachCell((cell) => {
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = headerAlignment;
    cell.border = headerBorder;
  });

  // Estilos para datos
  const dataBorder = {
    left: { style: "thin", color: { argb: "FFD3D3D3" } },
    right: { style: "thin", color: { argb: "FFD3D3D3" } },
    top: { style: "thin", color: { argb: "FFD3D3D3" } },
    bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
  };

  const dataAlignment = {
    horizontal: "left",
    vertical: "center",
    wrapText: true,
  };

  const dataFont = {
    size: 10,
    color: { argb: "FF000000" },
  };

  const lightGrayFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF5F5F5" },
  };

  // Agregar datos de votantes
  voters.forEach((voter, index) => {
    const row = worksheet.getRow(index + 2);
    row.values = {
      Identificacion: voter.identification || "N/A",
      Nombre: voter.firstName || "N/A",
      Apellido: voter.lastName || "N/A",
      Genero: voter.gender === "M" ? "Masculino" : voter.gender === "F" ? "Femenino" : "Otro",
      Telefono: voter.phone || "N/A",
      Email: voter.email || "N/A",
      Departamento: voter.department?.name || "N/A",
      Municipio: voter.municipality?.name || "N/A",
      CentroVotacion: voter.votingBooth?.name || "N/A",
      Mesa: voter.votingTableId || "N/A",
    };

    row.height = 18;
    row.eachCell((cell) => {
      cell.border = dataBorder;
      cell.alignment = dataAlignment;
      cell.font = dataFont;

      // Alternar colores de fila
      if (index % 2 === 0) {
        cell.fill = lightGrayFill;
      }
    });
  });

  // Congelar primera fila
  worksheet.views = [{ state: "frozen", ySplit: 1, xSplit: 0 }];

  // Generar nombre de archivo con fecha y tipo de filtro
  const timestamp = new Date().toISOString().split("T")[0];
  const filterLabel = filterType === "registered" ? "Registrados" : filterType === "pending" ? "Pendientes" : "Esperados";
  const fullFileName = `${fileName}_${filterLabel}_${timestamp}.xlsx`;

  // Generar buffer y descargar
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fullFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
