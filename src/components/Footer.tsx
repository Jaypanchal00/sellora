import { Link } from "@tanstack/react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebook, faInstagram, faTwitter, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { faEnvelope, faPhone, faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";
import logo from "@/assets/sellora-logo.png";

export function Footer() {
  return (
    <footer className="bg-white border-t border-border/60 pt-16 pb-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Col */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <img src={logo} alt="Sellora" className="h-10 w-auto" />
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed max-w-sm mb-8">
              Sellora is India's most trusted marketplace for buying and selling locally. 
              Join millions of users and start trading today.
            </p>
            <div className="flex items-center gap-5 text-gray-400">
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
            <h3 className="font-black text-primary uppercase text-xs tracking-widest mb-6">Trending Locations</h3>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><a href="#" className="hover:text-primary transition-colors">Mumbai</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Delhi</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Bangalore</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Hyderabad</a></li>
            </ul>
          </div>

          {/* Links Col 2 */}
          <div>
            <h3 className="font-black text-primary uppercase text-xs tracking-widest mb-6">Support</h3>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><Link to="/$pageId" params={{ pageId: "help" }} className="hover:text-primary transition-colors">Help Center</Link></li>
              <li><Link to="/$pageId" params={{ pageId: "trust" }} className="hover:text-primary transition-colors">Legal & Privacy</Link></li>
              <li><Link to="/$pageId" params={{ pageId: "contact" }} className="hover:text-primary transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Contact Col */}
          <div>
            <h3 className="font-black text-primary uppercase text-xs tracking-widest mb-6">Follow Us</h3>
            <div className="flex gap-4">
               {/* Social icons are already above, maybe app links here */}
               <img src="https://statics.olx.in/external/base/img/appstore_2x.webp" alt="" className="h-8" />
               <img src="https://statics.olx.in/external/base/img/playstore_2x.webp" alt="" className="h-8" />
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border/60 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400 font-bold uppercase tracking-tight">
          <p>© {new Date().getFullYear()} Sellora. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/$pageId" params={{ pageId: "privacy" }} className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/$pageId" params={{ pageId: "terms" }} className="hover:text-primary transition-colors">Terms of Use</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
