import { Link } from "@tanstack/react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebook, faInstagram, faTwitter, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { faEnvelope, faPhone, faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";

export function Footer() {
  return (
    <footer className="mt-10 border-t border-slate-200 bg-white">
      <div className="container mx-auto px-4 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Col */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563eb] text-white shadow-sm">
                <span className="font-bold text-lg leading-none mt-[-1px]">S</span>
              </div>
              <span className="font-extrabold text-[22px] tracking-tight text-[#2563eb] uppercase">
                SELLORA
              </span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm mb-6">
              Sellora is the next-generation premium marketplace for buying and selling locally.
              Discover amazing deals, chat with trusted sellers, and make secure transactions.
            </p>
            <div className="flex items-center gap-4 text-slate-400">
              <a href="#" className="hover:text-[#2563eb] transition-colors">
                <FontAwesomeIcon icon={faFacebook} className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-[#2563eb] transition-colors">
                <FontAwesomeIcon icon={faTwitter} className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-[#2563eb] transition-colors">
                <FontAwesomeIcon icon={faInstagram} className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-[#2563eb] transition-colors">
                <FontAwesomeIcon icon={faLinkedin} className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links Col 1 */}
          <div>
            <h3 className="font-bold text-slate-900 mb-4 text-[15px]">Company</h3>
            <ul className="space-y-3 text-sm text-slate-500 font-medium">
              <li>
                <Link to="/" className="hover:text-[#2563eb] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-[#2563eb] transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-[#2563eb] transition-colors">
                  Press & Media
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-[#2563eb] transition-colors">
                  Sellora Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Col 2 */}
          <div>
            <h3 className="font-bold text-slate-900 mb-4 text-[15px]">Support</h3>
            <ul className="space-y-3 text-sm text-slate-500 font-medium">
              <li>
                <Link to="/" className="hover:text-[#2563eb] transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-[#2563eb] transition-colors">
                  Trust & Safety
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-[#2563eb] transition-colors">
                  Selling Tips
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-[#2563eb] transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Col */}
          <div>
            <h3 className="font-bold text-slate-900 mb-4 text-[15px]">Get in Touch</h3>
            <ul className="space-y-3 text-sm text-slate-500 font-medium">
              <li className="flex items-center gap-2">
                <FontAwesomeIcon icon={faEnvelope} className="h-4 w-4 text-slate-400" /> support@sellora.com
              </li>
              <li className="flex items-center gap-2">
                <FontAwesomeIcon icon={faPhone} className="h-4 w-4 text-slate-400" /> 1-800-SELLORA
              </li>
              <li className="flex items-center gap-2 items-start">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  123 Tech Avenue,<br />
                  Silicon Valley, CA 94025
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-sm font-medium text-slate-500">
          <p>© {new Date().getFullYear()} Sellora Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/" className="hover:text-[#2563eb] transition-colors">
              Privacy Policy
            </Link>
            <Link to="/" className="hover:text-[#2563eb] transition-colors">
              Terms of Service
            </Link>
            <Link to="/" className="hover:text-[#2563eb] transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
