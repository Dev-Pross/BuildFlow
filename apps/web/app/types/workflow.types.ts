export interface NodeType {
  data: {
    TYpe: "Trigger" | "Action";
    SelectedType: string;
    label : string
    config : JSON
  };

  id: string;
  position: { x: number; y: number };
}
export interface Edage {
  id: string;
  source: string;

  target: string;
}
export interface AvailableTrigger {
  id: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
}
export interface AvailabeAction {
  id: string;
  name: string;
  type: string;
  config: JSON;
}
