use <knurledFinishLib_v2_1.scad>
$fn=150;


diam  = 30;
hoydeGrep  = 40;
hoydeTupp = 10; 


hoydeBit = 20;    
diameterBit = 7.4;
antallKanter = 6;     // nutEdges

difference() {    
    union(){    
        knurled_cyl(hoydeGrep,diam,5,5,1,1,20);    
        translate( [0 ,0,hoydeGrep] ) cylinder(hoydeTupp, diam/2-diam/10, diam/2-diam/5); //H=5 - Konus
    }
    translate( [0,0, hoydeGrep+hoydeTupp-hoydeBit+1] )    
    cylinder(hoydeBit, d=diameterBit,$fn=antallKanter, center=false);     
}













