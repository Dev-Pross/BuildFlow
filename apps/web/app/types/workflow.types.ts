export interface NodeType {
  data: {
    Type: "Trigger" | "Action";
    SelectedType: string;
    label : string
    config? : any
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
  config: Record<string, unknown>;

}
