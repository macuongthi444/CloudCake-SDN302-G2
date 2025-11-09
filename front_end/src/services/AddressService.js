import ApiService from './ApiService';

class AddressService {
  async getAddresses(userId) {
    try {
      const data = await ApiService.get(`/address/user/${userId}`, true);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching addresses:', error);
      throw error;
    }
  }

  async getAddressById(id) {
    try {
      const data = await ApiService.get(`/address/find/${id}`, true);
      return data;
    } catch (error) {
      console.error('Error fetching address:', error);
      throw error;
    }
  }

  async createAddress(addressData) {
    try {
      const data = await ApiService.post('/address/create', addressData, true);
      return data;
    } catch (error) {
      console.error('Error creating address:', error);
      throw error;
    }
  }

  async updateAddress(id, addressData) {
    try {
      const data = await ApiService.put(`/address/edit/${id}`, addressData, true);
      return data;
    } catch (error) {
      console.error('Error updating address:', error);
      throw error;
    }
  }

  async deleteAddress(id) {
    try {
      const data = await ApiService.delete(`/address/delete/${id}`, true);
      return data;
    } catch (error) {
      console.error('Error deleting address:', error);
      throw error;
    }
  }
}

const addressService = new AddressService();
export default addressService;

