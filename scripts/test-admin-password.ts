import { signInAction } from '../src/lib/auth/actions';

async function testAdminLogin() {
  console.log('Testing Admin Login with Admin@123...');
  const formData = new FormData();
  formData.set('email', 'kmvsubbarao28@gmail.com');
  formData.set('password', 'Admin@123');
  formData.set('role', 'admin');
  formData.set('redirect', '/admin/dashboard');

  const result = await signInAction(formData);
  console.log('Admin login result:', result);

  if (!result.success) {
    console.error('❌ Admin login failed!');
    process.exit(1);
  }
  console.log('✅ Admin login SUCCESS! Redirecting to:', result.redirectTo);
}

testAdminLogin().catch((err) => {
  console.error(err);
  process.exit(1);
});
