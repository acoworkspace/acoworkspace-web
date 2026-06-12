import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer id="contacto" className="bg-neutral-900 text-neutral-300 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <Image src="/aco-logo.webp" alt="ACO Workspace" width={100} height={30} className="h-7 w-auto object-contain brightness-0 invert mb-4" />
            <p className="text-sm leading-relaxed text-neutral-400">
              Más de 5.000 m² en Palermo y Microcentro para trabajar como querés.
            </p>
          </div>

          <div>
            <h4 className="text-white font-medium mb-4">Sedes</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li>Palermo — Av. Raúl Scalabrini Ortiz 1135</li>
              <li>Microcentro — Lima 251</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-4">Contacto</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li>
                <a href="mailto:info@acoworkspace.com" className="hover:text-white transition-colors">
                  info@acoworkspace.com
                </a>
              </li>
              <li>
                <a href="tel:+5491128592763" className="hover:text-white transition-colors">
                  +54 9 11 2859-2763
                </a>
              </li>
              <li>
                <a href="https://instagram.com/aco.workspace" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  @aco.workspace
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-800 pt-8 text-xs text-neutral-500">
          © {new Date().getFullYear()} ACO Workspace. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
