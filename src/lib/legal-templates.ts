export interface LegalTemplate {
  id: string;
  title: string;
  description: string;
  content: string;
  category: "commercial" | "employment" | "corporate" | "other";
}

export const LEGAL_TEMPLATES: LegalTemplate[] = [
  {
    id: "letterhead",
    title: "Papier à en-tête",
    description: "Support officiel pour vos courriers et documents administratifs avec en-tête et pied de page.",
    category: "other",
    content: `
      <p>&nbsp;</p>
      <p style="text-align: right">Fait à [VILLE], le [DATE]</p>
      <p>&nbsp;</p>
      <p><strong>Objet :</strong> [OBJET]</p>
      <p>&nbsp;</p>
      <p>Madame, Monsieur,</p>
      <p>&nbsp;</p>
      <p>[VOTRE CONTENU ICI]</p>
      <p>&nbsp;</p>
      <p>Cordialement,</p>
    `
  },
  {
    id: "cgv-service",
    title: "Conditions Générales de Vente (Prestations)",
    description: "Modèle standard de CGV pour les prestataires de services.",
    category: "commercial",
    content: `
      <h1>Conditions Générales de Vente</h1>
      <p><strong>Date de dernière mise à jour :</strong> [DATE]</p>
      
      <h2>1. Objet</h2>
      <p>Les présentes Conditions Générales de Vente (ci-après "CGV") régissent les relations contractuelles entre [VOTRE NOM OU SOCIÉTÉ] (ci-après le "Prestataire") et son client (ci-après le "Client").</p>
      
      <h2>2. Prix et Modalités de Paiement</h2>
      <p>Les prix des services sont indiqués en Dinars Algériens (DZD) hors taxes. La TVA et autres taxes applicables seront ajoutées au taux en vigueur au moment de la facturation.</p>
      <p>Le paiement est exigible sous 30 jours à compter de la date de facture, sauf accord contraire écrit.</p>
      
      <h2>3. Obligations du Prestataire</h2>
      <p>Le Prestataire s'engage à fournir les services avec diligence et selon les règles de l'art. Il est tenu à une obligation de moyens.</p>
      
      <h2>4. Obligations du Client</h2>
      <p>Le Client s'engage à fournir toutes les informations nécessaires à la bonne exécution de la prestation et à régler le prix convenu.</p>
      
      <h2>5. Confidentialité</h2>
      <p>Les deux parties s'engagent à garder confidentielles toutes les informations échangées dans le cadre de l'exécution de la prestation.</p>
      
      <h2>6. Loi Applicable</h2>
      <p>Les présentes CGV sont soumises au droit algérien. Tout litige sera de la compétence exclusive des tribunaux du siège social du Prestataire.</p>
    `
  },
  {
    id: "nda",
    title: "Accord de Confidentialité (NDA)",
    description: "Accord de non-divulgation pour protéger vos informations sensibles.",
    category: "corporate",
    content: `
      <h1>Accord de Confidentialité</h1>
      
      <h2>1. Parties</h2>
      <p>Entre [VOTRE SOCIÉTÉ] (la "Partie Divulgatrice") et [NOM DU PARTENAIRE] (la "Partie Réceptrice").</p>
      
      <h2>2. Définition des Informations Confidentielles</h2>
      <p>Sont considérées comme confidentielles toutes les informations, techniques, commerciales ou financières, divulguées par l'une des parties à l'autre, par écrit ou oralement.</p>
      
      <h2>3. Obligations</h2>
      <p>La Partie Réceptrice s'engage à :</p>
      <ul>
        <li>Ne pas divulguer les Informations Confidentielles à des tiers sans accord écrit préalable.</li>
        <li>N'utiliser ces informations que dans le cadre de la relation commerciale établie.</li>
        <li>Prendre toutes les mesures raisonnables pour protéger la confidentialité de ces informations.</li>
      </ul>
      
      <h2>4. Durée</h2>
      <p>Cet engagement de confidentialité reste en vigueur pendant une durée de 5 ans à compter de la signature du présent accord.</p>
    `
  },
  {
    id: "contrat-prestation",
    title: "Contrat de Prestation de Services",
    description: "Contrat cadre pour une mission de prestation de services.",
    category: "commercial",
    content: `
      <h1>Contrat de Prestation de Services</h1>
      
      <h2>1. Désignation des Parties</h2>
      <p>Le présent contrat est conclu entre [VOTRE SOCIÉTÉ] ("le Prestataire") et [NOM DU CLIENT] ("le Client").</p>
      
      <h2>2. Objet du Contrat</h2>
      <p>Le Prestataire s'engage à réaliser pour le Client la mission suivante : [DESCRIPTION DE LA MISSION].</p>
      
      <h2>3. Durée</h2>
      <p>Le présent contrat débute le [DATE DE DÉBUT] et se termine le [DATE DE FIN] ou à l'achèvement de la mission.</p>
      
      <h2>4. Rémunération</h2>
      <p>En contrepartie de la réalisation de la mission, le Client versera au Prestataire la somme de [MONTANT] DZD HT.</p>
      
      <h2>5. Résiliation</h2>
      <p>Chaque partie peut résilier le contrat en cas de manquement grave de l'autre partie à ses obligations, après mise en demeure restée infructueuse pendant 15 jours.</p>
    `
  },
  {
    id: "devis-type",
    title: "Conditions Particulières (Devis)",
    description: "Texte standard à inclure en bas de vos devis.",
    category: "commercial",
    content: `
      <h3>Conditions de l'Offre</h3>
      <p>Cette offre est valable pour une durée de 30 jours.</p>
      <p><strong>Acompte :</strong> 30% à la commande.</p>
      <p><strong>Solde :</strong> À la livraison / fin de mission.</p>
      <p><strong>Délai de livraison :</strong> [NOMBRE] semaines après réception de l'acompte et des éléments nécessaires.</p>
    `
  }
];