import { http } from "@/shared/api";

export const getPassportData = async () => {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Пользователь не авторизован");

  const response = await http.get(
    "/api/user/personal-data",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );
  return response.data;
};

export const getPersonalData = async () => {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Пользователь не авторизован");

  const response = await http.get(
    "/api/user/personal",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );
  return response.data;
};

export const getIndividualEntrepreneurData = async () => {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Пользователь не авторизован");

  const response = await http.get(
    "/api/user/IndividualEnterepreneur",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );
  return response.data;
};

export const submitIndividualEntrepreneurData = async (data: {
  name: string;
  inn: string;
  ogrnip: string;
  file_ogrnip: File;
  payment_account: string;
  bank: string;
  bank_bik: string;
  bank_inn: string;
  correspondent_account: string;
  file_banking_details: File;
}) => {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Пользователь не авторизован");

  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("inn", data.inn);
  formData.append("ogrnip", data.ogrnip);
  formData.append("file_ogrnip", data.file_ogrnip);
  formData.append("payment_account", data.payment_account);
  formData.append("bank", data.bank);
  formData.append("bank_bik", data.bank_bik);
  formData.append("bank_inn", data.bank_inn);
  formData.append("correspondent_account", data.correspondent_account);
  formData.append("file_banking_details", data.file_banking_details);

  const response = await http.post(
    "/api/user/IndividualEnterepreneur",
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

export const getSelfEmployedData = async () => {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Пользователь не авторизован");

  const response = await http.get(
    "/api/user/SelfEmployed",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );
  return response.data;
};

export const submitSelfEmployedData = async (data: {
  file_self_employed: File;
  file_income_statement: File;
}) => {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Пользователь не авторизован");

  const formData = new FormData();
  formData.append("file_self_employed", data.file_self_employed);
  formData.append("file_income_statement", data.file_income_statement);

  const response = await http.post(
    "/api/user/SelfEmployed",
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

export const getAgentTypes = async () => {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Пользователь не авторизован");

  const response = await http.get(
    "/api/user/types",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );
  return response.data;
};

export const getProfileIsFilled = async () => {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Пользователь не авторизован");

  const response = await http.get(
    "/api/user/isfilled",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );
  return response.data;
};

export const setAgentType = async (account_type: string) => {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Пользователь не авторизован");

  const response = await http.post(
    "/api/user/types",
    { account_type },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );
  return response.data;
};

export const submitSelfEmployedForm = async (form: { file_self_employed: File; file_income_statement: File }) => {
  return submitSelfEmployedData({
    file_self_employed: form.file_self_employed,
    file_income_statement: form.file_income_statement,
  });
};

export const submitIndividualEntrepreneurForm = async (form: {
  name: string;
  inn: string;
  ogrnip: string;
  file_ogrnip: File;
  payment_account: string;
  bank: string;
  bank_bik: string;
  bank_inn: string;
  correspondent_account: string;
  file_banking_details: File;
}) => {
  return submitIndividualEntrepreneurData({
    name: form.name,
    inn: form.inn,
    ogrnip: form.ogrnip,
    file_ogrnip: form.file_ogrnip,
    payment_account: form.payment_account,
    bank: form.bank,
    bank_bik: form.bank_bik,
    bank_inn: form.bank_inn,
    correspondent_account: form.correspondent_account,
    file_banking_details: form.file_banking_details,
  });
};

export const sendUserEmailCode = async (email: string) => {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Пользователь не авторизован");
  const formData = new FormData();
  formData.append("mail", email);
  const response = await http.post(
    "/api/user/email",
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
        Accept: 'application/json',
      },
    }
  );
  return response.data;
};

export const sendUserEmailCodeVerify = async (email: string, code: string) => {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Пользователь не авторизован");
  const formData = new FormData();
  formData.append("mail", email);
  formData.append("code", code);
  const response = await http.post(
    "/api/user/email/code",
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
        Accept: 'application/json',
      },
    }
  );
  return response.data;
};

export const confirmProfileData = async () => {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Пользователь не авторизован");

  const response = await http.post(
    "/api/user/fill",
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );
  return response.data;
};

export const submitContactData = async (data: {
  name: string;
  surname: string;
  patronymic: string | null;
  telegram_username: string | null;
}) => {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Пользователь не авторизован");

  const response = await http.put("/api/user/personal", data, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  
  return response.data;
};

export const getUserData = async () => {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Пользователь не авторизован");

  const response = await http.get("/api/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  
  return response.data;
};

export const SubmitPassportData = async (passportData: {
  passport: string;
  passport_issued: string;
  passport_date: string;
  passport_code: string;
  birthday: string;
  birthday_place: string;
  registration_address: string;
  inn: string;
  bank_account: string;
  bank_bik: string;
  bank_name: string;
}) => {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("Пользователь не авторизован");

  const response = await http.put("/api/user/personal-data", passportData, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  
  return response.data;
};

interface UploadResponse {
  status: string;
  data: string;
}

const appendFileIfExists = (formData: FormData, key: string, file: File | null) => {
  if (file) {
    formData.append(key, file);
  }
};

export const uploadPassportDocuments = async (
  passport: File | null,
  passport_registration: File | null,
  agent_with_passport: File | null,
  file_inn: File | null,
  file_snils: File | null,
  file_banking_details: File | null
): Promise<UploadResponse> => {
  const formData = new FormData();
  
  appendFileIfExists(formData, 'passport', passport);
  appendFileIfExists(formData, 'passport_registration', passport_registration);
  appendFileIfExists(formData, 'agent_with_passport', agent_with_passport);
  appendFileIfExists(formData, 'file_inn', file_inn);
  appendFileIfExists(formData, 'file_snils', file_snils);
  appendFileIfExists(formData, 'file_banking_details', file_banking_details);
  const token = User.getToken();
  
  const response = await http.post(
    `/api/user/personal-data/upload`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
    }
  );
  
  return response.data;
};

export const getPassportFiles = async () => {
  const token = User.getToken();
  const response = await http.get(`/api/user/personal-data/files`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    }
  });
  return response.data;
};
