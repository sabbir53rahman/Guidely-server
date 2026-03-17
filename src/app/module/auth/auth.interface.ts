export interface ILoginUserPayload {
  email: string;
  password: string;
}

export interface IRegisterStudentPayload {
  name: string;
  email: string;
  password: string;
}

export interface IRegisterMentorPayload {
  name: string;
  email: string;
  password: string;
}

export interface IChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
