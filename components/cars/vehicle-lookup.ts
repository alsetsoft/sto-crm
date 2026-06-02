export interface VehicleLookupResult {
  make: string | null;
  model: string | null;
  year: number | null;
  vin: string | null;
  body_type: string | null;
}

/**
 * Calls the server vehicle-lookup route. Throws an Error with a
 * Ukrainian, user-facing message on failure (caller surfaces it as a toast).
 */
export async function lookupVehicleByPlate(
  plate: string
): Promise<VehicleLookupResult> {
  const res = await fetch(
    `/api/vehicle-lookup?plate=${encodeURIComponent(plate)}`,
    { cache: "no-store" }
  );

  const json = (await res.json().catch(() => ({}))) as {
    data?: VehicleLookupResult;
    error?: string;
  };

  if (!res.ok || !json.data) {
    const message =
      res.status === 501
        ? "Сервіс автозаповнення не налаштовано"
        : res.status === 404
          ? "Авто за цим держномером не знайдено"
          : res.status === 400
            ? "Невірний держномер"
            : "Не вдалося отримати дані за держномером";
    throw new Error(message);
  }

  return json.data;
}
