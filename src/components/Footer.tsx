import { Link } from "@tanstack/react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebook, faInstagram, faTwitter, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { faEnvelope, faPhone, faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";
import logo from "@/assets/sellora-logo.png";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border/60 bg-surface/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 pt-16 pb-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Col */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6 group">
              <span className="font-display text-3xl font-black tracking-tighter uppercase text-gradient-brand">
                Sellora
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mb-6">
              Sellora is the next-generation premium marketplace for buying and selling locally.
              Discover amazing deals, chat with trusted sellers, and make secure transactions.
            </p>
            <div className="flex items-center gap-4 text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">
                <FontAwesomeIcon icon={faFacebook} className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <FontAwesomeIcon icon={faTwitter} className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <FontAwesomeIcon icon={faInstagram} className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <FontAwesomeIcon icon={faLinkedin} className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links Col 1 */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link
                  to="/$pageId"
                  params={{ pageId: "about" }}
                  className="hover:text-primary transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/$pageId"
                  params={{ pageId: "careers" }}
                  className="hover:text-primary transition-colors"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  to="/$pageId"
                  params={{ pageId: "press" }}
                  className="hover:text-primary transition-colors"
                >
                  Press & Media
                </Link>
              </li>
              <li>
                <Link
                  to="/$pageId"
                  params={{ pageId: "blog" }}
                  className="hover:text-primary transition-colors"
                >
                  Sellora Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Col 2 */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Support</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link
                  to="/$pageId"
                  params={{ pageId: "help" }}
                  className="hover:text-primary transition-colors"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  to="/$pageId"
                  params={{ pageId: "trust" }}
                  className="hover:text-primary transition-colors"
                >
                  Trust & Safety
                </Link>
              </li>
              <li>
                <Link
                  to="/$pageId"
                  params={{ pageId: "tips" }}
                  className="hover:text-primary transition-colors"
                >
                  Selling Tips
                </Link>
              </li>
              <li>
                <Link
                  to="/$pageId"
                  params={{ pageId: "contact" }}
                  className="hover:text-primary transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Col */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Get in Touch</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <FontAwesomeIcon icon={faEnvelope} className="h-4 w-4" /> support@sellora.com
              </li>
              <li className="flex items-center gap-2">
                <FontAwesomeIcon icon={faPhone} className="h-4 w-4" /> 1-800-SELLORA
              </li>
              <li className="flex items-center gap-2 items-start">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="h-4 w-4 shrink-0 mt-0.5" /> 123
                Tech Avenue,
                <br />
                Silicon Valley, CA 94025
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border/60 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Sellora Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <Link
              to="/$pageId"
              params={{ pageId: "privacy" }}
              className="hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/$pageId"
              params={{ pageId: "terms" }}
              className="hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              to="/$pageId"
              params={{ pageId: "cookies" }}
              className="hover:text-foreground transition-colors"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
