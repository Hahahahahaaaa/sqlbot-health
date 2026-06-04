export interface Organization {
  id: string;
  name: string;
  level: number;
  parentId: string | null;
  dataSources: string[];
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
}

export interface Account {
  id: string;
  name: string;
  phone: string;
  roleId: string;
  orgId: string;
}

export interface User extends Account {
  org?: Organization;
  role?: Role;
}
