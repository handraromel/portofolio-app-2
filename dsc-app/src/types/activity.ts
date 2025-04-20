export interface Activity {
  id: string;
  type:
    | "sale_created"
    | "sale_updated"
    | "report_generated"
    | "data_imported"
    | "user_login"
    | "user_updated";
  message: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
  };
  entity_id?: string;
  entity_type?: string;
  meta_data?: Record<string, unknown>;
}
