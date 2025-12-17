export interface LegalTemplate {
  id: string;
  title: string;
  description: string;
  content: string;
  category: "commercial" | "employment" | "corporate" | "other";
  displayRegistrationInHeader?: boolean;
  requiresClientSignature?: boolean;
}

export const LEGAL_TEMPLATES: LegalTemplate[] = [
  {
    id: "letterhead",
    title: "Papier à en-tête",
    description: "Support officiel pour vos courriers et documents administratifs avec en-tête et pied de page.",
    category: "other",
    displayRegistrationInHeader: false,
    requiresClientSignature: false,
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
    displayRegistrationInHeader: true,
    requiresClientSignature: true,
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
    displayRegistrationInHeader: true,
    requiresClientSignature: true,
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
    displayRegistrationInHeader: true,
    requiresClientSignature: true,
    content: `
      <h1>Contrat de Prestation de Services</h1>
      
      <h2>1. Désignation des Parties</h2>
      <p>Le présent contrat est conclu entre [VOTRE SOCIÉTÉ] (\"le Prestataire\") et [NOM DU CLIENT] (\"le Client\").</p>
      
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
    displayRegistrationInHeader: true,
    requiresClientSignature: true,
    content: `
      <h3>Conditions de l'Offre</h3>
      <p>Cette offre est valable pour une durée de 30 jours.</p>
      <p><strong>Acompte :</strong> 30% à la commande.</p>
      <p><strong>Solde :</strong> À la livraison / fin de mission.</p>
      <p><strong>Délai de livraison :</strong> [NOMBRE] semaines après réception de l'acompte et des éléments nécessaires.</p>
    `
  },
  {
    id: "etude-technico-economique",
    title: "Étude Technico-Économique",
    description: "Structure complète pour présenter la faisabilité technique et la rentabilité économique d'un projet.",
    category: "corporate",
    displayRegistrationInHeader: true,
    requiresClientSignature: false,
    content: `
      <h1>Étude Technico-Économique</h1>
      <p><strong>Projet :</strong> [NOM DU PROJET]</p>
      <p><strong>Date :</strong> [DATE]</p>

      <h2>1. Présentation du Projet</h2>
      <p>Description détaillée du projet, de ses objectifs et de son contexte.</p>

      <h2>2. Étude de Marché</h2>
      <h3>2.1 La Demande</h3>
      <p>Analyse de la clientèle cible et des besoins.</p>
      <h3>2.2 L'Offre</h3>
      <p>Analyse de la concurrence et positionnement.</p>

      <h2>3. Étude Technique</h2>
      <h3>3.1 Moyens Matériels</h3>
      <p>Locaux, équipements, machines et technologies nécessaires.</p>
      <h3>3.2 Moyens Humains</h3>
      <p>Organigramme, effectifs et compétences requises.</p>

      <h2>4. Étude Financière</h2>
      <h3>4.1 Investissements Initiaux</h3>
      <p>Détail des coûts de démarrage (frais d'établissement, équipements, BFR).</p>
      <h3>4.2 Compte de Résultat Prévisionnel</h3>
      <p>Chiffre d'affaires prévisionnel et charges d'exploitation sur 3 ans.</p>
      <h3>4.3 Rentabilité</h3>
      <p>Calcul du seuil de rentabilité et du retour sur investissement (ROI).</p>

      <h2>5. Conclusion</h2>
      <p>Synthèse sur la viabilité et la faisabilité du projet.</p>
    `
  },
  {
    id: "business-plan",
    title: "Business Plan",
    description: "Dossier de présentation stratégique pour investisseurs ou banques.",
    category: "corporate",
    displayRegistrationInHeader: true,
    requiresClientSignature: false,
    content: `
      <h1>Business Plan</h1>
      
      <h2>1. Executive Summary</h2>
      <p>Résumé opérationnel du projet en une page : opportunité, solution, modèle économique et besoins de financement.</p>

      <h2>2. Présentation de l'Entreprise</h2>
      <p>Historique, mission, vision et valeurs. Présentation des fondateurs et de l'équipe dirigeante.</p>

      <h2>3. Produits et Services</h2>
      <p>Description détaillée de l'offre, avantages concurrentiels, propriété intellectuelle.</p>

      <h2>4. Analyse du Marché</h2>
      <p>Taille du marché, tendances, segmentation, analyse SWOT (Forces, Faiblesses, Opportunités, Menaces).</p>

      <h2>5. Stratégie Marketing et Commerciale</h2>
      <p>Positionnement prix, canaux de distribution, stratégie de communication et d'acquisition client.</p>

      <h2>6. Plan Opérationnel</h2>
      <p>Localisation, production, logistique, fournisseurs clés.</p>

      <h2>7. Prévisions Financières</h2>
      <p>Plan de financement, compte de résultat prévisionnel, plan de trésorerie sur 3 à 5 ans.</p>
    `
  },
  {
    id: "pitch-deck-structure",
    title: "Structure Pitch Deck",
    description: "Trame narrative pour présenter votre projet à des investisseurs ou partenaires.",
    category: "corporate",
    displayRegistrationInHeader: true,
    requiresClientSignature: false,
    content: `
      <h1>Pitch Deck (Structure Narrative)</h1>
      
      <h2>1. Le Problème</h2>
      <p>Quel est le problème douloureux que vous résolvez ? Qui en souffre ?</p>

      <h2>2. La Solution</h2>
      <p>Votre proposition de valeur unique. Comment votre produit/service résout-il le problème ?</p>

      <h2>3. Le Marché</h2>
      <p>Quelle est la taille de l'opportunité (TAM, SAM, SOM) ? Pourquoi maintenant ?</p>

      <h2>4. Le Produit</h2>
      <p>Démonstration ou description de la solution. Fonctionnalités clés.</p>

      <h2>5. Modèle Économique (Business Model)</h2>
      <p>Comment gagnez-vous de l'argent ? (Vente directe, abonnement, commission, etc.)</p>

      <h2>6. Traction</h2>
      <p>Preuves de concept, métriques clés, premiers clients, partenariats.</p>

      <h2>7. L'Équipe</h2>
      <p>Pourquoi êtes-vous la meilleure équipe pour exécuter ce plan ?</p>

      <h2>8. La Demande (The Ask)</h2>
      <p>De quoi avez-vous besoin (financement, partenaires) et pour quoi faire ?</p>
    `
  },
  {
    id: "contrat-travail-cdi",
    title: "Contrat de Travail (CDI)",
    description: "Modèle de contrat à durée indéterminée standard.",
    category: "employment",
    displayRegistrationInHeader: true,
    requiresClientSignature: true,
    content: `
      <h1>Contrat de Travail à Durée Indéterminée</h1>
      
      <p>Entre la Société [NOM DE LA SOCIÉTÉ], sise à [ADRESSE], représentée par [NOM DU REPRÉSENTANT], ci-après l'Employeur,</p>
      <p>Et M./Mme [NOM DU SALARIÉ], demeurant à [ADRESSE], ci-après le Salarié.</p>

      <h2>1. Engagement</h2>
      <p>Le Salarié est engagé à compter du [DATE DE DÉBUT] en qualité de [INTITULÉ DU POSTE], sous contrat à durée indéterminée.</p>

      <h2>2. Période d'Essai</h2>
      <p>Le présent contrat ne deviendra définitif qu'à l'issue d'une période d'essai de [DURÉE] mois, renouvelable une fois.</p>

      <h2>3. Fonctions et Attributions</h2>
      <p>Le Salarié sera chargé des missions suivantes : [LISTE DES TÂCHES].</p>

      <h2>4. Lieu de Travail</h2>
      <p>Le lieu de travail est fixé à [ADRESSE DU LIEU DE TRAVAIL].</p>

      <h2>5. Durée du Travail</h2>
      <p>La durée de travail est fixée à 40 heures hebdomadaires.</p>

      <h2>6. Rémunération</h2>
      <p>Le Salarié percevra une rémunération mensuelle brute de [MONTANT] DZD.</p>

      <h2>7. Congés Payés</h2>
      <p>Le Salarié bénéficiera des congés payés conformément à la législation en vigueur.</p>
    `
  },
  {
    id: "lettre-mission",
    title: "Lettre de Mission",
    description: "Pour formaliser une mission ponctuelle ou de conseil.",
    category: "commercial",
    displayRegistrationInHeader: true,
    requiresClientSignature: true,
    content: `
      <h1>Lettre de Mission</h1>
      
      <p><strong>Client :</strong> [NOM DU CLIENT]</p>
      <p><strong>Consultant :</strong> [VOTRE NOM]</p>
      <p><strong>Date :</strong> [DATE]</p>

      <h2>1. Contexte</h2>
      <p>Le Client souhaite bénéficier de l'expertise du Consultant pour [OBJECTIF DE LA MISSION].</p>

      <h2>2. Objectifs de la Mission</h2>
      <ul>
        <li>Objectif 1 : [DÉTAIL]</li>
        <li>Objectif 2 : [DÉTAIL]</li>
      </ul>

      <h2>3. Périmètre d'Intervention</h2>
      <p>Le Consultant interviendra sur les domaines suivants : [DOMAINES].</p>

      <h2>4. Livrables</h2>
      <p>À l'issue de la mission, le Consultant remettra : [LISTE DES LIVRABLES].</p>

      <h2>5. Planning Prévisionnel</h2>
      <p>La mission débutera le [DATE] pour une durée estimée de [DURÉE].</p>

      <h2>6. Honoraires</h2>
      <p>Les honoraires sont fixés à [MONTANT] DZD HT, payables selon l'échéancier suivant : [ÉCHÉANCIER].</p>
    `
  }
];