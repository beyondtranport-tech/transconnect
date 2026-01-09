
import AccountPage from "@/app/account/page";

// This component simply re-exports the main AccountPage component.
// This allows the /adminaccount route to render the same content as the /account route,
// resolving the 404 error for the admin user.
export default function AdminAccountPage() {
  return <AccountPage />;
}
