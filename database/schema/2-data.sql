INSERT into users 
    (unityID, note, questionPriv, userPriv)
VALUES
    ('wrmungas', 'developer', TRUE, TRUE),
    ('drsalin2', 'developer', TRUE, TRUE),
    ('rkwicken', 'developer', TRUE, TRUE),
    ('rmaalay', 'developer', TRUE, TRUE),
    ('clhekkin', 'developer', TRUE, TRUE),
    ('rbraha', 'developer', TRUE, TRUE);


-- Category 1: History & Evolution
INSERT INTO questions (question, corrAnswer, incorrONE, incorrTWO, incorrTHREE, category, isAI) VALUES
    ('Before plastic was common, milk was delivered in glass bottles that were collected, washed, and refilled. What is this called?', 'A Returnable or Reuse system', 'Single-use distribution', 'Linear consumption', 'Disposable logistics', 1, TRUE),
    ('Tin Cans were widely adopted during the Napoleonic Wars primarily to:', 'Preserve food for soldiers over long durations', 'Reduce the weight of soldier gear', 'Make food taste better', 'Prevent water from leaking into tents', 1, TRUE),
    ('Which 19th-century process made aluminum cheap enough for everyday soda cans?', 'The Hall-Heroult process', 'The Bessemer process', 'The Pasteurization process', 'The Vulcanization process', 1, TRUE),
    ('In the early 1900s, what transparent material made from wood pulp was the first see-through flexible packaging?', 'Cellophane', 'Vinyl', 'Polyester', 'Acrylic', 1, TRUE),
    ('Why was the 1950s invention of the shipping container a leap for global efficiency?', 'It standardized sizes for seamless transfer between modes', 'It was the first time metal was used for shipping', 'It made ships move faster through water', 'It eliminated the need for sailors', 1, TRUE),
    ('Who patented the machine that created the Square Bottom paper bag, allowing it to stand upright?', 'Margaret Knight', 'Eli Whitney', 'Thomas Edison', 'Alexander Graham Bell', 1, TRUE),
    ('In the Victorian era, what was commonly used to seal champagne bottles before the wire cage?', 'Wax and string', 'Rubber bands', 'Plastic wrap', 'Aluminum foil', 1, TRUE),
    ('The 1980s Blue Bin movement gained traction following which famous stranded trash ship event?', 'The Mobro 4000 Garbage Barge', 'The Exxon Valdez', 'The Titanic', 'The Santa Maria', 1, TRUE),
    ('Early soda bottles had rounded bottoms so they could not be stood up. Why was this done?', 'To keep the cork moist to prevent leaks', 'To make them easier to roll on the floor', 'To save on glass material costs', 'To prevent people from putting them on tables', 1, TRUE),
    ('What 1970s crisis forced the industry to look for lighter, non-petroleum based materials?', 'The 1973 Oil Crisis', 'The Great Depression', 'The Cold War', 'The Dot-com Bubble', 1, TRUE),
    ('Before the 1960s, most soda cans required a separate tool to open them called a:', 'Churchkey', 'Can-spanner', 'Bottle-axe', 'Lever-pull', 1, TRUE),
    ('What was the first food product to be sold in a Folding Carton (cereal box style)?', 'Quaker Oats', 'Kelloggs Corn Flakes', 'Campbells Soup', 'Hershey Bars', 1, TRUE),
    ('The military developed Retort Pouches (flexible foil bags) because they are:', 'Lighter and safer to carry than metal cans', 'Able to be used as pillows', 'Completely transparent', 'Made of recycled parachutes', 1, TRUE),
    ('In the 1800s, how were biscuits usually sold in general stores before individual packaging?', 'In bulk from large wooden barrels', 'In small plastic bags', 'Wrapped in aluminum foil', 'In refrigerated glass cases', 1, TRUE),
    ('The universal recycling symbol was designed for a contest celebrating the first:', 'Earth Day', 'World War II Victory', 'Industrial Revolution', 'Space Landing', 1, TRUE);

-- Category 2: Technical Aspects & Engineering
INSERT INTO questions (question, corrAnswer, incorrONE, incorrTWO, incorrTHREE, category, isAI) VALUES
    ('Which property allows a plastic bottle to shrink when heated while glass does not?', 'Thermoplasticity', 'Opacity', 'Ductility', 'Porosity', 2, TRUE),
    ('When designing a box for a heavy TV, which strength is most important for stacking?', 'Compression Strength', 'Tensile Strength', 'Shear Strength', 'Torsional Strength', 2, TRUE),
    ('Why is Multi-layer packaging (like juice boxes) harder to recycle than single-material bottles?', 'The layers are difficult to separate', 'The material is too thick for machines', 'The foil makes the paper catch fire', 'The plastic layer is toxic', 2, TRUE),
    ('What is the primary purpose of the wavy middle layer (corrugation) in a box?', 'To provide rigidity while staying lightweight', 'To trap air for insulation', 'To make the box waterproof', 'To hide the product from view', 2, TRUE),
    ('In physics, why is a soda bottle thicker than a still water bottle?', 'To withstand internal gas pressure', 'To keep the drink colder', 'To prevent the color from fading', 'To make the bottle look larger', 2, TRUE),
    ('Which material is infinitely recyclable without losing quality?', 'Aluminum', 'Paper', 'Plastic', 'Wood', 2, TRUE),
    ('Why is Nitrogen gas pumped into chip bags before sealing?', 'To displace Oxygen and prevent rancidity', 'To make the bag look fuller', 'To make the chips crunchier', 'To keep the chips from freezing', 2, TRUE),
    ('What does Opacity refer to in packaging?', 'The ability to block light', 'The weight of the material', 'The smoothness of the surface', 'The resistance to tearing', 2, TRUE),
    ('In engineering, what is Lightweighting?', 'Reducing material use without failing function', 'Making a package float in water', 'Using white colors to reflect heat', 'Using hollow handles on bottles', 2, TRUE),
    ('Why is Polyethylene (PE) used for milk jugs instead of standard paper?', 'It provides an effective moisture barrier', 'It is cheaper than trees', 'It makes the milk taste sweeter', 'It is easier to print on', 2, TRUE),
    ('What is the main reason a vacuum seal helps food last longer?', 'It removes Oxygen needed by bacteria', 'It makes the food more compact', 'It prevents the food from moving', 'It adds a protective layer of cold', 2, TRUE),
    ('Which type of stress is a grocery bag handle under when carrying heavy items?', 'Tensile stress', 'Compression stress', 'Bending stress', 'Friction stress', 2, TRUE),
    ('Why is Clear plastic usually more valuable to recyclers than Colored plastic?', 'It can be dyed any color later', 'It is stronger than colored plastic', 'It melts at a lower temperature', 'It is easier for people to see', 2, TRUE),
    ('What is the purpose of the induction seal (foil peel) on medicine bottles?', 'To provide evidence of tampering', 'To keep the pills from rattling', 'To make the bottle easier to grip', 'To provide a space for the barcode', 2, TRUE),
    ('If a material is Brittle, how will it respond to a sudden drop?', 'It will shatter rather than deform', 'It will bounce like rubber', 'It will flatten into a pancake', 'It will turn into a liquid', 2, TRUE);

-- Category 3: Sustainability
INSERT INTO questions (question, corrAnswer, incorrONE, incorrTWO, incorrTHREE, category, isAI) VALUES
    ('Of the 3 Rs (Reduce, Reuse, Recycle), which is the most effective?', 'Reduce', 'Reuse', 'Recycle', 'They are all equal', 3, TRUE),
    ('What is a Carbon Footprint?', 'Total greenhouse gas emissions of a product', 'The physical mark left by a factory', 'The amount of coal used in shipping', 'The weight of a package in carbon', 3, TRUE),
    ('Which material requires the most energy to produce from raw (virgin) sources?', 'Aluminum', 'Plastic', 'Paper', 'Glass', 3, TRUE),
    ('What does it mean if a package is Bio-based?', 'It is made from biological sources like corn', 'It can be eaten by humans', 'It grows back if you plant it', 'It contains live bacteria', 3, TRUE),
    ('Plastic pieces in the ocean smaller than 5mm are called:', 'Microplastics', 'Nanoplastics', 'Polymers', 'Silt', 3, TRUE),
    ('Why is Compostable packaging often unhelpful in a standard trash can?', 'Landfills lack the oxygen/heat needed to break it down', 'It will explode under pressure', 'It turns into toxic sludge', 'It attracts too many birds', 3, TRUE),
    ('What is Greenwashing?', 'Misleading consumers about environmental benefits', 'Cleaning plastic before recycling it', 'Using green ink on a label', 'Planting trees to offset a flight', 3, TRUE),
    ('In a Closed-loop system, what happens to a bottle after use?', 'It is recycled into the same type of bottle', 'It is turned into a lower-quality item', 'It is buried in a safe landfill', 'It is sent to a different country', 3, TRUE),
    ('Which term refers to environmental impact from Cradle to Grave?', 'Life Cycle Assessment', 'Carbon Accounting', 'Circular Mapping', 'End-of-Life Planning', 3, TRUE),
    ('Why is recycling paper sometimes a trade-off?', 'Fibers get shorter each time it is recycled', 'It uses more water than virgin paper', 'It makes the paper turn blue', 'Recycled paper is illegal in some states', 3, TRUE),
    ('What is the primary gas released by rotting organic waste in landfills?', 'Methane', 'Oxygen', 'Helium', 'Nitrogen', 3, TRUE),
    ('Why is Over-packaging a sustainability issue beyond just waste?', 'It wastes truck space and fuel', 'It makes the product too heavy to lift', 'It causes the product to expire faster', 'It is harder for robots to scan', 3, TRUE),
    ('What is the Pacific Garbage Patch?', 'A massive collection of floating plastic debris', 'A specialized landfill in Hawaii', 'A fleet of ships that collects trash', 'A type of seaweed that looks like plastic', 3, TRUE),
    ('Which of these materials is considered renewable?', 'Cardboard', 'Petroleum-based plastic', 'Aluminum', 'Glass', 3, TRUE),
    ('What is a Circular Economy?', 'A system aimed at eliminating waste by reusing resources', 'An economy based on the sale of round objects', 'A market where prices never change', 'A system where only cash is used', 3, TRUE);

-- Category 4: Consumerism & Ethics
INSERT INTO questions (question, corrAnswer, incorrONE, incorrTWO, incorrTHREE, category, isAI) VALUES
    ('What is the primary purpose of Nutritional Labeling?', 'Transparency about ingredients and health', 'To make the package look professional', 'To follow the laws of physics', 'To hide the calories from children', 4, TRUE),
    ('Child-resistant caps on medicine are primarily an:', 'Ethical requirement for safety', 'Engineering trick to save plastic', 'Marketing tool for parents', 'Way to keep the medicine fresh', 4, TRUE),
    ('Is a Recyclable claim ethical if local facilities cannot process the material?', 'No, it is considered greenwashing', 'Yes, because it is technically possible', 'Yes, if the label is small', 'No, because it is illegal to use that word', 4, TRUE),
    ('What is Planned Obsolescence?', 'Designing products to fail to encourage repeat sales', 'Planning a party for a retired product', 'Designing a package that lasts forever', 'Recycling a product before it is used', 4, TRUE),
    ('Fair Trade certification on coffee packaging ensures:', 'Farmers were paid a living wage', 'The coffee was grown in a fair climate', 'The package was shipped for free', 'The coffee contains no caffeine', 4, TRUE),
    ('What is the Halo Effect in marketing?', 'When one good trait makes the whole product seem better', 'Using a circle around the brand name', 'A package that glows in the dark', 'Giving free samples to customers', 4, TRUE),
    ('Why do brands use red and yellow on food packaging?', 'To trigger hunger or urgency', 'Because those colors are the cheapest', 'To signal that the food is spicy', 'To make the package easier to see at night', 4, TRUE),
    ('What is the ethical concern with Shrinkflation?', 'Reducing product amount while keeping package size/price', 'Making the package too small to read', 'The package shrinking when it gets cold', 'Using thin plastic that breaks easily', 4, TRUE),
    ('Why is Accessibility important in packaging?', 'To ensure elderly/disabled people can open it', 'To make sure it fits on every shelf', 'To ensure the price is low', 'To make it easy to see from far away', 4, TRUE),
    ('What is a Deposit-Return scheme?', 'Paying a fee that is refunded when the bottle is returned', 'A way to buy shares in a plastic company', 'Returning a product if it tastes bad', 'A tax on every piece of trash', 4, TRUE),
    ('Why do some countries require Plain Packaging for cigarettes?', 'To reduce brand appeal and smoking', 'To save money on expensive inks', 'To make them easier to recycle', 'To prevent children from seeing the logos', 4, TRUE),
    ('What is the Precautionary Principle?', 'Avoiding a chemical if it might be harmful, even without 100% proof', 'Being careful when opening sharp boxes', 'Locking a warehouse at night', 'Wearing a helmet in a factory', 4, TRUE),
    ('Why is Portion Control packaging ethically complicated?', 'It prevents overeating but creates more plastic waste', 'It is too expensive for most people', 'It makes the food go bad faster', 'It is hard for people to share', 4, TRUE),
    ('What is the primary reason for Tamper-evident seals?', 'To ensure the product hasn''t been altered', 'To keep the lid from falling off', 'To hide the smell of the food', 'To make the package look expensive', 4, TRUE),
    ('How does Subscription packaging (like meal kits) change waste habits?', 'It increases shipping and insulation waste at home', 'It makes people stop using trash cans', 'It eliminates the need for grocery stores', 'It makes recycling much easier', 4, TRUE);

-- Category 5: End-of-Life & Data
INSERT INTO questions (question, corrAnswer, incorrONE, incorrTWO, incorrTHREE, category, isAI) VALUES
    ('What is a MRF (Materials Recovery Facility)?', 'A plant where mixed recycling is sorted', 'A museum for old packaging', 'A school for truck drivers', 'A place where plastic is invented', 5, TRUE),
    ('What does the number inside the recycling triangle identify?', 'The type of plastic resin used', 'How many times it has been recycled', 'The price of the material', 'The thickness of the plastic', 5, TRUE),
    ('What is Contamination in a recycling bin?', 'When non-recyclables are mixed with clean items', 'When the bin is too full to close', 'When the plastic is a bright color', 'When the bin is made of wood', 5, TRUE),
    ('Which is easier to sort using magnets?', 'Steel cans', 'Aluminum cans', 'Glass bottles', 'Paper boxes', 5, TRUE),
    ('What is Downcycling?', 'Recycling a material into a lower quality item', 'Riding a bike to the recycling center', 'Recycling a product before it is sold', 'Burying plastic in the ground', 5, TRUE),
    ('Why did China''s National Sword policy matter globally?', 'China stopped buying low-quality plastic waste', 'China invented a new way to melt glass', 'China banned the use of all plastic', 'China started giving away free paper', 5, TRUE),
    ('What happens to plastic that is Incinerated?', 'It is burned to create energy', 'It is melted into new bottles', 'It is buried in a deep hole', 'It is sent to the ocean', 5, TRUE),
    ('What is Leachate in a landfill?', 'Contaminated liquid that drains from the bottom', 'A type of bug that eats trash', 'The gas that smells like eggs', 'The heavy machines that crush boxes', 5, TRUE),
    ('Why is Wish-cycling harmful?', 'It can jam machines or ruin good batches', 'It makes the recycling bin too heavy', 'It makes people feel too good about themselves', 'It is a form of illegal gambling', 5, TRUE),
    ('How do Optical Sorters work?', 'They use light sensors and air puffs to sort items', 'They are people with very good eyesight', 'They use giant magnifying glasses', 'They sort items by their smell', 5, TRUE),
    ('What is the Recovery Rate of a material?', 'Percentage recycled versus what was sold', 'How long it takes a forest to grow back', 'The speed of a recycling truck', 'The temperature at which plastic melts', 5, TRUE),
    ('Why is glass crushed into Cullet before recycling?', 'It melts faster at lower temperatures', 'It makes it safer for the workers', 'It changes the color of the glass', 'It allows it to be used as sand on beaches', 5, TRUE),
    ('What is a Digital Watermark on packaging?', 'An invisible code used for high-speed sorting', 'A logo that appears when the box gets wet', 'A website address on the label', 'A way to track a package via GPS', 5, TRUE),
    ('Which plastic numbers are almost always accepted curbside?', '1 and 2', '6 and 7', 'Only 5', 'All numbers are accepted', 5, TRUE),
    ('What is a Sanitary Landfill?', 'A lined hole designed to protect the soil', 'A place where trash is washed with soap', 'A landfill located inside a city', 'A factory that turns trash into food', 5, TRUE);

-- Category 6: Logistics & Distribution
INSERT INTO questions (question, corrAnswer, incorrONE, incorrTWO, incorrTHREE, category, isAI) VALUES
    ('What is The Last Mile in shipping?', 'The trip from a hub to the customer''s door', 'The final mile of a marathon', 'The length of a very long ship', 'The distance a box falls during a drop test', 6, TRUE),
    ('Why are Pallets standardized in size?', 'To fit perfectly into trucks and forklifts', 'To make them easier to build by hand', 'Because wood only grows in certain lengths', 'To prevent people from stealing them', 6, TRUE),
    ('What is Void Fill?', 'Materials used to fill empty space in a box', 'A hole in the side of a shipping ship', 'A type of ink that never dries', 'The sound a box makes when it is empty', 6, TRUE),
    ('Why is Air the enemy of efficient logistics?', 'Shipping empty space wastes money and fuel', 'It makes the boxes float away', 'It causes the product to rust', 'It makes the truck too light to drive', 6, TRUE),
    ('What is Dimensional Weight (Dim Weight)?', 'Pricing based on size rather than just weight', 'The weight of a box in another dimension', 'The weight of the air inside the box', 'A way to weigh boxes while they are moving', 6, TRUE),
    ('What is Cold Chain logistics?', 'A temperature-controlled supply chain', 'A chain made of frozen metal', 'Shipping goods only during the winter', 'A way to lock a fridge during transport', 6, TRUE),
    ('Why use Corrugated boxes instead of wood crates?', 'They are lighter and cheaper', 'They are stronger than steel', 'They can be eaten if lost at sea', 'They are made by hand', 6, TRUE),
    ('What is Cross-docking?', 'Moving goods directly between trucks with no storage', 'When two trucks crash into each other', 'Loading a boat at a 45-degree angle', 'A way to ship goods across a river', 6, TRUE),
    ('Why is Stretch Wrap used on pallets?', 'To keep boxes from shifting or falling', 'To keep the boxes warm', 'To make the pallet look shiny', 'To prevent people from seeing the product', 6, TRUE),
    ('What is Reverse Logistics?', 'Moving goods from the consumer back to the seller', 'Driving a truck backward into a warehouse', 'A way to un-recycle a product', 'Shipping goods to the wrong address', 6, TRUE),
    ('Why is rail transport usually more sustainable than trucks?', 'Trains move more weight per gallon of fuel', 'Trains use wood instead of diesel', 'Trains only travel at night', 'Trains don''t use tires', 6, TRUE),
    ('What is a SKU (Stock Keeping Unit)?', 'A unique barcode used for tracking', 'A type of glue used for boxes', 'The weight of a single pallet', 'A small vehicle used in a warehouse', 6, TRUE),
    ('What is Just-in-Time (JIT) delivery?', 'Shipping goods exactly when they are needed', 'Delivering a package one minute early', 'A delivery service that uses clocks', 'Shipping goods only on Tuesdays', 6, TRUE),
    ('Why are some shipping boxes Double-walled?', 'For extra strength for heavy/fragile items', 'To keep the product twice as cold', 'So you can use both sides of the box', 'To make the box waterproof', 6, TRUE),
    ('What is the benefit of E-commerce specific packaging?', 'It survives the rougher parcel network', 'It is always made of recycled plastic', 'It can be opened by a voice command', 'It is designed to be thrown away immediately', 6, TRUE);