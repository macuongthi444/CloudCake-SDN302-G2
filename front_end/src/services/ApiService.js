// src/services/ApiService.js

import { BE_API_URL } from '../config/config';
import AuthService from './AuthService';

const API_URL = `${BE_API_URL}/api`;

class ApiService {
  constructor() {
    this.API_URL = API_URL; // Expose API_URL for external use
  }

  // Phương thức GET
  async get(endpoint, secure = true) {
    const headers = this.getHeaders(secure);
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers
      });
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Phương thức POST
  async post(endpoint, data, secure = true) {
    const headers = this.getHeaders(secure);
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Phương thức PUT
  async put(endpoint, data, secure = true) {
    const headers = this.getHeaders(secure);
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      });
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Phương thức DELETE
  async delete(endpoint, secure = true) {
    const headers = this.getHeaders(secure);
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers
      });
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Phương thức PATCH
  async patch(endpoint, data, secure = true) {
    const headers = this.getHeaders(secure);
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data)
      });
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Phương thức Upload File (đã cập nhật)
  async uploadFile(endpoint, formData, secure = true) {
    try {
      // Chỉ thêm token, không thêm Content-Type vì sẽ được tự động thiết lập bởi fetch khi sử dụng FormData
      const headers = {};

      if (secure) {
        const token = AuthService.getToken();
        if (token) {
          headers['x-access-token'] = token;
        }
      }

      // In ra đường dẫn để debug
      console.log("Uploading to URL:", `${API_URL}${endpoint}`);

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData
      });

      // Kiểm tra nếu response không ok (status không phải 2xx)
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", response.status, errorText);
        throw new Error(`HTTP error! Status: ${response.status}, Detail: ${errorText}`);
      }

      return this.handleResponse(response);
    } catch (error) {
      console.error("Upload error in service:", error);
      return this.handleError(error);
    }
  }

  // Lấy headers, bao gồm token nếu là API bảo mật
  getHeaders(secure) {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (secure) {
      const token = AuthService.getToken();
      if (token) {
        headers['x-access-token'] = token;
      }
    }

    return headers;
  }

  // Xử lý response
  async handleResponse(response) {
    const text = await response.text();
    const data = text && JSON.parse(text);

    if (!response.ok) {
      // Nếu lỗi 401 Unauthorized, đăng xuất người dùng
      if (response.status === 401) {
        AuthService.logout();
        window.location.href = '/login';
      }

      const error = (data && data.message) || response.statusText;
      return Promise.reject(error);
    }

    return data;
  }

  // Xử lý lỗi mạng
  handleError(error) {
    console.error('API call error:', error);
    return Promise.reject(error.message || 'Lỗi kết nối đến server');
  }
  // Phương thức POST với FormData
  async postFormData(endpoint, formData, secure = true) {
    try {
      // Chỉ thêm token, không thêm Content-Type
      const headers = {};

      if (secure) {
        const token = AuthService.getToken();
        if (token) {
          headers['x-access-token'] = token;
        }
      }

      console.log("Posting FormData to URL:", `${API_URL}${endpoint}`);

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData
      });

      // Kiểm tra nếu response không ok
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", response.status, errorText);
        throw new Error(`HTTP error! Status: ${response.status}, Detail: ${errorText}`);
      }

      return this.handleResponse(response);
    } catch (error) {
      console.error("POST FormData error:", error);
      return this.handleError(error);
    }
  }

  // Phương thức PUT với FormData
  async putFormData(endpoint, formData, secure = true) {
    try {
      // Chỉ thêm token, không thêm Content-Type
      const headers = {};

      if (secure) {
        const token = AuthService.getToken();
        if (token) {
          headers['x-access-token'] = token;
        }
      }

      console.log("Putting FormData to URL:", `${API_URL}${endpoint}`);

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers,
        body: formData
      });

      // Kiểm tra nếu response không ok
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", response.status, errorText);
        throw new Error(`HTTP error! Status: ${response.status}, Detail: ${errorText}`);
      }

      return this.handleResponse(response);
    } catch (error) {
      console.error("PUT FormData error:", error);
      return this.handleError(error);
    }
  }
}

export default new ApiService();