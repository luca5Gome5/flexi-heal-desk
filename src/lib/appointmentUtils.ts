export const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    scheduled: "Agendado",
    confirmed: "Confirmado",
    completed: "Concluído",
    cancelled: "Cancelado",
    no_show: "Não Compareceu",
  };
  return statusMap[status] || status;
};

export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    scheduled: "bg-amber-500", // Dourado
    confirmed: "bg-green-500", // Verde
    completed: "bg-gray-900", // Preto
    cancelled: "bg-red-500", // Vermelho
    no_show: "bg-gray-500",
  };
  return colorMap[status] || "bg-gray-500";
};

export const getStatusTextColor = (status: string): string => {
  const textColorMap: Record<string, string> = {
    scheduled: "text-amber-700",
    confirmed: "text-green-700",
    completed: "text-gray-900",
    cancelled: "text-red-700",
    no_show: "text-gray-700",
  };
  return textColorMap[status] || "text-gray-700";
};
