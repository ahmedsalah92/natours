import axios from 'axios';

export const updateUser = async formData => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: '/api/v1/users/update-me',
      data: formData
    });

    if (res.data.status === 'success') {
      alert('Data Updated');
    }
  } catch (err) {
    alert(err.response.data.message);
  }
};

export const resetPassword = async (passwordCurrent, password, passwordConfirm) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: '/api/v1/users/update-password',
      data: {
        passwordCurrent,
        password,
        passwordConfirm
      }
    });

    if (res.data.status === 'success') {
      alert('password Reset');
    }
  } catch (err) {
    alert(err.response.data.message);
  }
};
