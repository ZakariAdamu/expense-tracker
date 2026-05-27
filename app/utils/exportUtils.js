import * as XLSX from "xlsx";

export const exportToExcel = (data, filename) => {
  //   XLSX.writeFile(workbook, `${filename}.xlsx`);
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

    // Trigger the file download into an Excel file
    XLSX.writeFile(workbook, `${filename}.xlsx`, {
      bookType: "xlsx",
      type: "array",
    });
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    alert("An error occurred while exporting to Excel. Please try again.");
  }
};
