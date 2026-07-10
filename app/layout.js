import { getSessionUser } from "@/lib/auth";
import { initializeDatabase } from "@/lib/init-db";
import Navbar from "./components/Navbar";
import "./globals.css";

export const metadata = {
  title: "CommunityHub | Local Event Planning Platform",
  description: "Create, manage, and discover local community events, workshops, and gatherings on Microsoft Azure.",
};

export default async function RootLayout({ children }) {
  // Initialize the database on application render
  try {
    await initializeDatabase();
  } catch (err) {
    console.error("Database connection failed on startup:", err);
  }

  const user = await getSessionUser();

  return (
    <html lang="en">
      <body>
        <div className="app-container">
          <Navbar user={user} />
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
